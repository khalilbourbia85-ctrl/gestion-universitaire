from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction, IntegrityError
from .models import Etudiant
from .serializers import EtudiantSerializer
from utils.excel_utils import (
    read_file_intelligent, ColumnMapper, DataCleaner,
    ImportReporter, validate_required_fields_flexible
)
import logging

logger = logging.getLogger(__name__)


class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all()
    serializer_class = EtudiantSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Etudiant.objects.select_related('licence', 'specialite').all()
        
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Etudiant.objects.none()
            
        role = getattr(enseignant, 'role', '')
        departement = getattr(enseignant, 'departement', None)

        qs = Etudiant.objects.select_related('licence', 'specialite')
        
        if role == 'admin':
            return qs.all()
        elif role == 'chef_departement' and departement:
            return qs.filter(
                Q(licence__departement=departement) |
                Q(specialite__licence__departement=departement) |
                Q(licence__isnull=True)
            ).distinct()
        
        return Etudiant.objects.none()

    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Impossible de supprimer cet étudiant car il est assigné à un PFE."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='import-excel', permission_classes=[AllowAny])
    def import_excel(self, request):
        """
        Intelligent and flexible Excel/CSV import for students
        Automatically detects file format, maps columns, cleans data, and provides detailed reports
        Supports: .xlsx, .xls, .csv
        """
        # Debug: Log all request data
        logger.info(f"📥 Requête d'import reçue")
        logger.info(f"   - Méthode: {request.method}")
        logger.info(f"   - Content-Type: {request.content_type}")
        logger.info(f"   - FILES clés: {list(request.FILES.keys())}")
        logger.info(f"   - POST clés: {list(request.POST.keys())}")
        
        # Check for file in request
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            logger.error(f"❌ Pas de fichier 'file' trouvé dans FILES")
            logger.error(f"   - FILES disponibles: {request.FILES}")
            return Response(
                {'error': 'Aucun fichier fourni. Vérifiez le formulaire et réessayez.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"✓ Fichier reçu: {file_obj.name}, taille: {file_obj.size} bytes")
        
        try:
            filename = file_obj.name.lower()
            logger.info(f"📥 Début import fichier: {filename}")
            
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
            
            # CRITICAL required fields: these must be present in the file headers
            critical_fields = ['cin', 'nom_fr', 'prenom_fr']
            
            # IMPORTANT fields - if missing, we provide smart defaults
            important_fields_with_defaults = {
                'email': 'no-email@example.local',  # Will be replaced by unique email generation
                'numTel': '0000000000',
                'dateNaissance': '2000-01-01',
                'adresse': 'Non spécifié'
            }
            
            if not all(field in mapped_cols for field in critical_fields):
                missing_critical = [field for field in critical_fields if field not in mapped_cols]
                logger.error(f"❌ Colonnes critiques manquantes: {missing_critical}")
                return Response({
                    'success': False,
                    'message': 'Colonnes critiques manquantes dans le fichier',
                    'error': f"Colonnes requises manquantes: {', '.join(missing_critical)}",
                    'mapping_info': {
                        'mapped_columns': mapped_cols,
                        'ignored_columns': ignored_cols,
                        'missing_fields': missing_fields,
                        'critical_fields_found': False,
                        'fields_with_defaults_applied': list(important_fields_with_defaults.keys())
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reporter = ImportReporter()
            imported_count = 0
            
            reporter = ImportReporter()
            imported_count = 0
            
            # Process each row, use per-row transaction to isolate failures
            for row_idx, row_data in rows:
                with transaction.atomic():
                    try:
                        # Map columns to model fields
                        mapped_row = column_mapper.map_row(row_data)

                        # Clean data
                        cleaned_row = DataCleaner.clean_row(mapped_row, mapped_row.keys())

                        # Check CRITICAL fields - these must have data
                        critical_missing = []
                        for field in critical_fields:
                            value = cleaned_row.get(field)
                            if not value or (isinstance(value, str) and not value.strip()):
                                critical_missing.append(field)

                        if critical_missing:
                            error_msg = f"Champs obligatoires vides: {', '.join(critical_missing)}"
                            reporter.add_error(row_idx, error_msg)
                            reporter.add_skipped_row(row_idx, error_msg)
                            logger.warning(f"Ligne {row_idx}: {error_msg}")
                            continue

                        # Fill in IMPORTANT fields with smart defaults if missing
                        for field, default_value in important_fields_with_defaults.items():
                            if field not in cleaned_row or not cleaned_row.get(field):
                                if field == 'email':
                                    # Generate unique email from CIN
                                    cin = cleaned_row.get('cin', 'unknown')
                                    cleaned_row[field] = f"etudiant.{cin}@univ.local"
                                else:
                                    cleaned_row[field] = default_value
                                logger.info(f"Ligne {row_idx}: Champ '{field}' manquant, utilisation du défaut: {cleaned_row[field]}")

                        # Try to find existing by CIN only (passport no longer unique)
                        existing = None
                        cin = cleaned_row.get('cin')

                        if cin:
                            existing = Etudiant.objects.filter(cin=cin).first()

                        try:
                            if existing:
                                reporter.add_warning(row_idx, f"Étudiant existant trouvé (CIN), mise à jour en place")
                                for key, value in cleaned_row.items():
                                    if hasattr(existing, key) and value is not None:
                                        setattr(existing, key, value)
                                existing.save()
                                imported_count += 1
                            else:
                                # Create new using model fields directly to avoid strict serializer validation blocking imports
                                model_field_names = [f.name for f in Etudiant._meta.get_fields() if getattr(f, 'concrete', False) and not (getattr(f, 'many_to_many', False) or getattr(f, 'auto_created', False))]
                                create_data = {k: v for k, v in cleaned_row.items() if k in model_field_names}
                                try:
                                    Etudiant.objects.create(**create_data)
                                    reporter.add_imported_row(row_idx, create_data)
                                    imported_count += 1
                                except IntegrityError as ie2:
                                    # Attempt to resolve by updating the conflicting existing record (by email only now)
                                    msg2 = str(ie2)
                                    reporter.add_error(row_idx, f"IntegrityError on create: {msg2}")
                                    logger.warning(f"Ligne {row_idx}: IntegrityError on create: {msg2}")
                                    # try to find existing by email only
                                    conflict = None
                                    if cleaned_row.get('email'):
                                        conflict = Etudiant.objects.filter(email=cleaned_row.get('email')).first()
                                    if conflict:
                                        for key, value in create_data.items():
                                            if hasattr(conflict, key) and value is not None:
                                                setattr(conflict, key, value)
                                        conflict.save()
                                        reporter.add_warning(row_idx, f"Conflit résolu en mettant à jour l'enregistrement existant (id={conflict.pk})")
                                        imported_count += 1
                                    else:
                                        reporter.add_skipped_row(row_idx, f"IntegrityError: {msg2}")
                        except IntegrityError as ie:
                            # Handle unique constraint conflicts gracefully by attempting to update the conflicting record
                            msg = str(ie)
                            reporter.add_error(row_idx, f"IntegrityError: {msg}")
                            logger.warning(f"Ligne {row_idx}: IntegrityError: {msg}")
                            # If email conflict, try to update the existing by email
                            if cleaned_row.get('email'):
                                conflict = Etudiant.objects.filter(email=cleaned_row.get('email')).first()
                                if conflict:
                                    for key, value in cleaned_row.items():
                                        if hasattr(conflict, key) and value is not None:
                                            setattr(conflict, key, value)
                                    conflict.save()
                                    reporter.add_warning(row_idx, f"Conflit unique résolu: mise à jour de l'étudiant avec email {cleaned_row.get('email')}")
                                    imported_count += 1
                                else:
                                    reporter.add_skipped_row(row_idx, f"IntegrityError: {msg}")
                                reporter.add_skipped_row(row_idx, f"IntegrityError: {msg}")
                                continue
                    except Exception as e:
                        # Fallback error handler for row processing
                        reporter.add_error(row_idx, f"Erreur traitement ligne: {str(e)}")
                        reporter.add_skipped_row(row_idx, f"Erreur traitement: {str(e)}")
                        logger.error(f"Ligne {row_idx}: Erreur: {str(e)}", exc_info=True)
                    except Exception as e:
                        # Fallback error handler for row processing
                        reporter.add_error(row_idx, f"Erreur traitement ligne: {str(e)}")
                        logger.error(f"Ligne {row_idx}: Erreur: {str(e)}", exc_info=True)
            
            logger.info(f"✅ Import terminé: {imported_count} étudiants importés")
            
            # Prepare response
            return Response({
                'success': imported_count > 0,
                'message': f"{imported_count} étudiant(s) importé(s) avec succès",
                'imported_count': imported_count,
                'report': reporter.get_report(),
                'mapping_info': {
                    'mapped_columns': column_mapper.get_mapped_columns(),
                    'ignored_columns': list(column_mapper.get_ignored_columns()),
                    'missing_fields': list(column_mapper.get_missing_fields()),
                    'critical_fields_found': all(f in column_mapper.get_mapped_columns() for f in critical_fields),
                    'fields_with_defaults_applied': list(important_fields_with_defaults.keys())
                }
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            error_msg = f"Erreur critique: {str(e)}"
            logger.error(f"❌ {error_msg}", exc_info=True)
            return Response(
                {'error': error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='debug-list', permission_classes=[AllowAny])
    def debug_list(self, request):
        """Temporary dev-only endpoint: return first 200 students without auth for UI debugging."""
        try:
            qs = Etudiant.objects.all().select_related('licence', 'specialite')[:200]
            serializer = EtudiantSerializer(qs, many=True)
            return Response({'count': len(serializer.data), 'results': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('debug_list error: %s', e, exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
