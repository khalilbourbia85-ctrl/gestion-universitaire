import re
import logging
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from .models import Enseignant, Diplome, Contractuel
from .serializers import EnseignantSerializer, DiplomeSerializer, ContractuelSerializer
from utils.excel_utils import (
    read_file_intelligent, 
    ColumnMapper, DataCleaner, ImportReporter, validate_required_fields_flexible
)

logger = logging.getLogger(__name__)


class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.all()
    serializer_class = EnseignantSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Enseignant.objects.all()
        
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Enseignant.objects.none()
            
        role = getattr(enseignant, 'role', '')
        departement = getattr(enseignant, 'departement', None)

        qs = Enseignant.objects.prefetch_related(
            'enseignantdiplome_set__idDiplome',
            'titres__permanent',
            'titres__vacataire',
            'titres__contractuel__contratdocteur',
            'titres__contractuel__contratdoctorant'
        )
        if role == 'admin':
            return qs.all()
        elif role == 'chef_departement' and departement:
            return qs.filter(Q(departement=departement) | Q(departement__isnull=True))
        
        return qs.filter(matricule=enseignant.matricule)

    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Impossible de supprimer cet enseignant car il est assigné en tant qu'encadrant ou rapporteur à un PFE ou à une soutenance."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='import-excel', permission_classes=[AllowAny])
    def import_excel(self, request):
        """
        Intelligent and flexible Excel/CSV import for teachers
        Automatically detects file format, maps columns, cleans data, and provides detailed reports
        Supports: .xlsx, .xls, .csv
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': 'Aucun fichier fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            filename = file_obj.name.lower()
            logger.info(f"📥 Début import fichier enseignants: {filename}")
            
            # Read file with intelligent format detection
            headers, rows, read_errors, column_mapper = read_file_intelligent(file_obj)
            
            if read_errors:
                error_msg = read_errors[0]
                logger.error(f"❌ Erreur lecture: {error_msg}")
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not rows:
                logger.warning("⚠️  Aucune donnée à importer")
                return Response(
                    {'error': 'Aucune donnée trouvée dans le fichier'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"✓ Fichier chargé avec succès: {len(rows)} lignes")
            logger.info(f"📊 En-têtes trouvés: {list(headers.keys())}")
            
            # Log column mapping
            mapped_cols = column_mapper.get_mapped_columns()
            ignored_cols = column_mapper.get_ignored_columns()
            missing_fields = column_mapper.get_missing_fields()
            
            logger.info(f"✅ Colonnes mappées: {mapped_cols}")
            logger.info(f"⊘ Colonnes ignorées: {ignored_cols}")
            logger.info(f"⚠️  Champs du modèle non trouvés: {missing_fields}")
            
            # Fields that are absolutely required for teachers
            required_fields = ['matricule', 'nom', 'prenom', 'email', 'cin', 'numtel', 'grade', 'dateRecrutement']
            
            reporter = ImportReporter()
            imported_count = 0
            
            # Process each row
            with transaction.atomic():
                for row_idx, row_data in rows:
                    try:
                        # Map columns to model fields
                        mapped_row = column_mapper.map_row(row_data)
                        
                        # Fix enseignant-specific field names (handle nom_fr -> nom, prenom_fr -> prenom)
                        if 'nom_fr' in mapped_row and 'nom' not in mapped_row:
                            mapped_row['nom'] = mapped_row.pop('nom_fr')
                        if 'prenom_fr' in mapped_row and 'prenom' not in mapped_row:
                            mapped_row['prenom'] = mapped_row.pop('prenom_fr')
                        
                        # Clean data
                        cleaned_row = DataCleaner.clean_row(mapped_row, mapped_row.keys())
                        
                        # Validate required fields BEFORE field name transformation
                        is_valid, missing_in_data = validate_required_fields_flexible(
                            cleaned_row,
                            ['matricule', 'nom', 'prenom', 'email', 'cin', 'numtel', 'grade', 'daterecrutement'],
                            set(mapped_row.keys())
                        )
                        
                        if not is_valid:
                            error_msg = f"Champs obligatoires vides: {', '.join(missing_in_data)}"
                            reporter.add_error(row_idx, error_msg)
                            logger.warning(f"Ligne {row_idx}: {error_msg}")
                            continue
                        
                        # Fix camelCase field names for enseignant model (AFTER validation)
                        # daterecrutement -> dateRecrutement
                        if 'daterecrutement' in cleaned_row and 'dateRecrutement' not in cleaned_row:
                            cleaned_row['dateRecrutement'] = cleaned_row.pop('daterecrutement')
                        if 'statutadministratif' in cleaned_row and 'statutAdministratif' not in cleaned_row:
                            cleaned_row['statutAdministratif'] = cleaned_row.pop('statutadministratif')
                        
                        # Ensure numtel is cleaned properly
                        if 'numtel' in cleaned_row and cleaned_row['numtel']:
                            cleaned_row['numtel'] = DataCleaner.clean_phone(cleaned_row['numtel'])
                        
                        # Try to create or update teacher
                        try:
                            matricule = cleaned_row.get('matricule')
                            if matricule:
                                existing = Enseignant.objects.filter(matricule=matricule).first()
                                if existing:
                                    reporter.add_warning(row_idx, f"Enseignant {matricule} existe déjà, mise à jour en place")
                                    # Update existing
                                    for key, value in cleaned_row.items():
                                        if hasattr(existing, key) and value is not None:
                                            setattr(existing, key, value)
                                    existing.save()
                                    imported_count += 1
                                    reporter.add_imported_row(row_idx, cleaned_row)
                                    logger.info(f"Ligne {row_idx}: Enseignant mis à jour ({matricule})")
                                    continue
                            
                            # Create new teacher
                            serializer = EnseignantSerializer(data=cleaned_row)
                            if serializer.is_valid():
                                serializer.save()
                                imported_count += 1
                                reporter.add_imported_row(row_idx, cleaned_row)
                                logger.info(f"Ligne {row_idx}: Enseignant créé ({cleaned_row.get('matricule')})")
                            else:
                                errors = serializer.errors
                                error_details = '; '.join([f"{k}: {v}" for k, v in errors.items()])
                                reporter.add_error(row_idx, f"Erreur validation: {error_details}")
                                logger.warning(f"Ligne {row_idx}: Erreur validation - {error_details}")
                        
                        except Exception as save_error:
                            error_msg = f"Erreur sauvegarde: {str(save_error)}"
                            reporter.add_error(row_idx, error_msg)
                            logger.error(f"Ligne {row_idx}: {error_msg}")
                    
                    except Exception as row_error:
                        error_msg = f"Erreur traitement ligne: {str(row_error)}"
                        reporter.add_error(row_idx, error_msg)
                        logger.error(f"Ligne {row_idx}: {error_msg}", exc_info=True)
            
            # Generate report
            report = reporter.get_report()
            logger.info(f"\n📈 RÉSUMÉ IMPORT:")
            logger.info(f"   Lignes traitées: {report['total_processed']}")
            logger.info(f"   ✅ Importées: {report['imported_count']}")
            logger.info(f"   ❌ Erreurs: {report['error_count']}")
            logger.info(f"   ⊘ Ignorées: {report['skipped_count']}")
            
            return Response({
                'success': True,
                'message': f'{imported_count} enseignant(s) importé(s) avec succès',
                'imported_count': imported_count,
                'report': report,
                'mapping_info': {
                    'mapped_columns': mapped_cols,
                    'ignored_columns': ignored_cols,
                    'missing_fields': missing_fields,
                }
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Erreur import: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur lors de l\'import: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class DiplomeViewSet(viewsets.ModelViewSet):
    queryset = Diplome.objects.all()
    serializer_class = DiplomeSerializer


class ContractuelViewSet(viewsets.ModelViewSet):
    queryset = Contractuel.objects.all()
    serializer_class = ContractuelSerializer
