from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Q
import re

# Importation des modèles
from .models import Departement, Licence, Specialite, Module, UEElement

# Importation des serializers
from .serializers import (
    DepartementSerializer,
    LicenceSerializer,
    SpecialiteSerializer,
    ModuleSerializer,
    UEElementSerializer
)

# Classe de permission personnalisée
from rest_framework.permissions import BasePermission

# Fonctions utilitaires pour lire les fichiers Excel et CSV
from utils.excel_utils import read_excel_file, read_csv_file


# =====================================================
# Permission personnalisée :
# Autorise uniquement les administrateurs
# et les chefs de département
# =====================================================
class IsAdminOrChefDepartement(BasePermission):

    def has_permission(self, request, view):

        # Vérifier si l'utilisateur est authentifié
        if not request.user or not request.user.is_authenticated:
            return False

        # Autoriser l'administrateur système
        if request.user.is_superuser:
            return True

        try:
            enseignant = getattr(request.user, 'enseignant', None)

            if not enseignant:
                return False

            role = getattr(enseignant, 'role', '')

            # Vérification du rôle
            return role in ['admin', 'chef_departement']

        except Exception:
            return False


# =====================================================
# ViewSet Département
# Gestion CRUD des départements
# =====================================================
class DepartementViewSet(viewsets.ModelViewSet):

    # Ensemble des départements
    queryset = Departement.objects.all()

    # Serializer utilisé
    serializer_class = DepartementSerializer

    # Formats acceptés
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    # -------------------------------------------------
    # Filtrage des départements selon le rôle connecté
    # -------------------------------------------------
    def get_queryset(self):

        user = self.request.user

        # Administrateur : accès total
        if getattr(user, 'is_superuser', False):
            return Departement.objects.all()

        enseignant = getattr(user, 'enseignant', None)

        if not enseignant:
            return Departement.objects.none()

        role = getattr(enseignant, 'role', '')

        # Admin académique
        if role == 'admin':
            return Departement.objects.all()

        # Chef département : accès à son département uniquement
        elif role == 'chef_departement' and enseignant.departement_id:
            return Departement.objects.filter(
                id=enseignant.departement_id
            )

        return Departement.objects.none()

    # -------------------------------------------------
    # Création automatique du compte chef département
    # lors de la création d'un département
    # -------------------------------------------------
    def perform_create(self, serializer):

        dept = serializer.save()

        if dept.email and dept.code:

            from django.contrib.auth.models import User
            from enseignants.models import Enseignant

            # Création du compte utilisateur
            user, created = User.objects.get_or_create(
                username=dept.email,
                defaults={
                    'email': dept.email
                }
            )

            # Mot de passe = code département
            user.set_password(dept.code)
            user.save()

            # Création ou mise à jour du chef département
            Enseignant.objects.update_or_create(
                email=dept.email,
                defaults={
                    'user': user,
                    'nom': dept.responsable or 'Chef',
                    'prenom': dept.nom[:20] if dept.nom else 'Département',
                    'role': 'chef_departement',
                    'departement': dept,
                    'matricule': f"CHEF_{dept.id}",
                    'dateRecrutement': '2020-01-01',
                    'cin': f"CIN_{dept.id}"
                }
            )

    # -------------------------------------------------
    # Mise à jour automatique du compte chef département
    # -------------------------------------------------
    def perform_update(self, serializer):

        old_dept = self.get_object()

        old_email = old_dept.email

        dept = serializer.save()

        if dept.email and dept.code:

            from django.contrib.auth.models import User
            from enseignants.models import Enseignant

            user = None

            # Recherche de l'ancien utilisateur
            if old_email:
                user = User.objects.filter(
                    username=old_email
                ).first()

            # Recherche avec le nouvel email
            if not user:
                user = User.objects.filter(
                    username=dept.email
                ).first()

            if user:

                # Mise à jour des informations
                user.username = dept.email
                user.email = dept.email
                user.set_password(dept.code)
                user.save()

                Enseignant.objects.update_or_create(
                    user=user,
                    defaults={
                        'email': dept.email,
                        'nom': dept.responsable or 'Chef',
                        'prenom': dept.nom[:20] if dept.nom else 'Département',
                        'role': 'chef_departement',
                        'departement': dept,
                        'dateRecrutement': '2020-01-01',
                        'cin': f"CIN_{dept.id}"
                    }
                )

    # Mise à jour automatique du compte chef de département
# lorsqu'un département est modifié
def perform_update(self, serializer):

    # Récupération de l'ancien département
    old_dept = self.get_object()

    # Sauvegarde de l'ancien email
    old_email = old_dept.email

    # Enregistrement des nouvelles données
    dept = serializer.save()

    # Vérification de la présence des informations nécessaires
    if dept.email and dept.code:

        from django.contrib.auth.models import User
        from enseignants.models import Enseignant

        user = None

        # Recherche de l'utilisateur avec l'ancien email
        if old_email:
            user = User.objects.filter(username=old_email).first()

        # Recherche avec le nouvel email
        if not user:
            user = User.objects.filter(username=dept.email).first()

        if user:

            # Mise à jour du compte utilisateur
            user.username = dept.email
            user.email = dept.email
            user.set_password(dept.code)
            user.save()

            # Mise à jour du chef de département associé
            Enseignant.objects.update_or_create(
                user=user,
                defaults={
                    'email': dept.email,
                    'nom': dept.responsable or 'Chef',
                    'prenom': dept.nom[:20] if dept.nom else 'Département',
                    'role': 'chef_departement',
                    'departement': dept,
                    'dateRecrutement': '2020-01-01',
                    'cin': f"CIN_{dept.id}"
                }
            )


# =====================================================
# Importation des départements depuis Excel ou CSV
# =====================================================
@action(detail=False, methods=['post'], url_path='import-excel')
def import_excel(self, request):

    # Récupération du fichier envoyé
    file = request.FILES.get('file')

    # Vérification de l'existence du fichier
    if not file:
        return Response(
            {'detail': 'Aucun fichier fourni.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        # Détection du format du fichier
        filename = file.name.lower()

        if filename.endswith('.csv'):
            headers, rows, file_errors = read_csv_file(file)
        else:
            headers, rows, file_errors = read_excel_file(file)

        # Vérification des erreurs de lecture
        if file_errors:
            return Response(
                {'errors': file_errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        created = []
        errors = []

        # Transaction atomique pour garantir l'intégrité
        with transaction.atomic():

            for row_idx, row_data in rows:

                try:

                    # Extraction des données du fichier
                    nom = row_data.get('nom', '').strip()
                    code = row_data.get('code', '').strip()
                    responsable = row_data.get('responsable', '').strip()
                    email = row_data.get('email', '').strip()
                    telephone = row_data.get('telephone', '').strip()

                    # Validation du nom
                    if not nom:
                        errors.append(
                            f"Ligne {row_idx}: Nom du département manquant"
                        )
                        continue

                    # Création ou mise à jour du département
                    obj, created_flag = Departement.objects.update_or_create(
                        code=code or None,
                        defaults={
                            'nom': nom,
                            'responsable': responsable,
                            'email': email,
                            'telephone': telephone,
                        }
                    )

                    created.append({
                        'id': obj.id,
                        'nom': obj.nom,
                        'created': created_flag
                    })

                except Exception as e:
                    errors.append(
                        f"Ligne {row_idx}: {str(e)}"
                    )

        # Retour du résultat d'importation
        return Response({
            'created': created,
            'errors': errors,
            'message': f'{len(created)} département(s) importé(s) avec succès.'
        })

    except Exception as e:

        return Response(
            {'detail': f'Erreur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# =====================================================
# Gestion CRUD des spécialités
# =====================================================
class SpecialiteViewSet(viewsets.ModelViewSet):

    # Ensemble des spécialités disponibles
    queryset = Specialite.objects.all()

    # Serializer utilisé pour la conversion JSON
    serializer_class = SpecialiteSerializer

    # Types de fichiers acceptés par l'API
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Filtrage des spécialités selon le rôle de l'utilisateur connecté
    def get_queryset(self):

        # Récupération de l'utilisateur connecté
        user = self.request.user

        # Super administrateur : accès total
        if getattr(user, 'is_superuser', False):
            return Specialite.objects.all()

        # Récupération de l'enseignant associé
        enseignant = getattr(user, 'enseignant', None)

        # Aucun enseignant associé
        if not enseignant:
            return Specialite.objects.none()

        role = getattr(enseignant, 'role', '')

        # Administrateur : accès total
        if role == 'admin':
            return Specialite.objects.all()

        # Chef de département : accès limité à son département
        elif role == 'chef_departement' and enseignant.departement_id:
            return Specialite.objects.filter(
                Q(licence__departement_id=enseignant.departement_id) |
                Q(licence__isnull=True)
            )

        # Aucun accès
        return Specialite.objects.none()

    # Importation des spécialités depuis un fichier Excel ou CSV
    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):

        # Récupération du fichier envoyé
        file = request.FILES.get('file')

        # Vérification de la présence du fichier
        if not file:
            return Response(
                {'detail': 'Aucun fichier fourni.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            # Détection du format du fichier
            filename = file.name.lower()

            if filename.endswith('.csv'):
                headers, rows, file_errors = read_csv_file(file)
            else:
                headers, rows, file_errors = read_excel_file(file)

            # Vérification des erreurs de lecture
            if file_errors:
                return Response(
                    {'errors': file_errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            created = []
            errors = []

            # Transaction sécurisée
            with transaction.atomic():

                for row_idx, row_data in rows:

                    try:

                        # Extraction des données
                        nom = row_data.get('nom', '').strip()
                        code = row_data.get('code', '').strip()
                        licence_id = row_data.get('licence', '')

                        # Validation du nom
                        if not nom:
                            errors.append(f"Ligne {row_idx}: Nom manquant")
                            continue

                        # Recherche de la licence associée
                        licence = None

                        if licence_id:
                            try:
                                licence = Licence.objects.get(id=int(licence_id))
                            except (ValueError, Licence.DoesNotExist):
                                licence = Licence.objects.filter(
                                    nom__icontains=licence_id
                                ).first()

                        # Création ou mise à jour de la spécialité
                        obj, created_flag = Specialite.objects.update_or_create(
                            code=code or None,
                            defaults={
                                'nom': nom,
                                'licence': licence
                            }
                        )

                        created.append({
                            'id': obj.id,
                            'nom': obj.nom,
                            'created': created_flag
                        })

                    except Exception as e:
                        errors.append(
                            f"Ligne {row_idx}: {str(e)}"
                        )

            # Retour du résultat de l'importation
            return Response({
                'created': created,
                'errors': errors,
                'message': f'{len(created)} spécialité(s) importée(s) avec succès.'
            })

        except Exception as e:

            return Response(
                {'detail': f'Erreur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Récupération des spécialités d'une licence donnée
    @action(detail=False, methods=['get'])
    def by_licence(self, request):

        # Récupération de l'identifiant de la licence
        licence_id = request.query_params.get('licence_id')

        if licence_id:

            # Filtrage des spécialités de la licence
            specialites = Specialite.objects.filter(
                licence_id=licence_id
            )

            serializer = self.get_serializer(
                specialites,
                many=True
            )

            return Response(serializer.data)

        return Response([], status=status.HTTP_400_BAD_REQUEST)

class LicenceViewSet(viewsets.ModelViewSet):
    queryset = Licence.objects.all()
    serializer_class = LicenceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Licence.objects.all()
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Licence.objects.none()
        role = getattr(enseignant, 'role', '')
        if role == 'admin':
            return Licence.objects.all()
        elif role == 'chef_departement' and enseignant.departement_id:
            return Licence.objects.filter(
                Q(departement_id=enseignant.departement_id) | 
                Q(departement__isnull=True)
            )
        return Licence.objects.none()

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        """Import licenses from Excel or CSV file"""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Detect file type
            filename = file.name.lower()
            if filename.endswith('.csv'):
                headers, rows, file_errors = read_csv_file(file)
            else:
                headers, rows, file_errors = read_excel_file(file)
            
            if file_errors:
                return Response({'errors': file_errors}, status=status.HTTP_400_BAD_REQUEST)
            
            created = []
            errors = []
            
            with transaction.atomic():
                for row_idx, row_data in rows:
                    try:
                        nom = row_data.get('nom', '').strip() or row_data.get('name', '').strip()
                        code = row_data.get('code', '').strip()
                        dept_id = row_data.get('departement', '') or row_data.get('departementid', '')
                        
                        if not nom:
                            errors.append(f"Ligne {row_idx}: Nom manquant")
                            continue
                        
                        # Try to find departement
                        departement = None
                        if dept_id:
                            try:
                                departement = Departement.objects.get(id=int(dept_id))
                            except (ValueError, Departement.DoesNotExist):
                                departement = Departement.objects.filter(nom__icontains=dept_id).first()
                        
                        obj, created_flag = Licence.objects.update_or_create(
                            code=code or None,
                            defaults={
                                'nom': nom,
                                'departement': departement
                            }
                        )
                        created.append({'id': obj.id, 'nom': obj.nom, 'created': created_flag})
                    except Exception as e:
                        errors.append(f"Ligne {row_idx}: {str(e)}")
            
            return Response({
                'created': created,
                'errors': errors,
                'message': f'{len(created)} licence(s) importée(s) avec succès.'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'detail': f'Erreur: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    
    @action(detail=False, methods=['get'])
    def by_departement(self, request):
        """Récupère les licences d'un département spécifique"""
        dept_id = request.query_params.get('departement_id')
        if dept_id:
            licences = Licence.objects.filter(departement_id=dept_id)
            serializer = self.get_serializer(licences, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_400_BAD_REQUEST)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAdminOrChefDepartement]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            queryset = Module.objects.all()
        else:
            enseignant = getattr(user, 'enseignant', None)
            if not enseignant:
                return Module.objects.none()
            
            role = getattr(enseignant, 'role', '')
            departement = getattr(enseignant, 'departement', None)

            if role == 'admin':
                queryset = Module.objects.all()
            elif role == 'chef_departement' and departement:
                queryset = Module.objects.filter(
                    Q(licence__departement=departement) | 
                    Q(specialite__licence__departement=departement) |
                    Q(licence__isnull=True)
                ).distinct()
            else:
                return Module.objects.none()
        
        licence_id = self.request.query_params.get('licence') or self.request.query_params.get('licence_id')
        specialite_id = self.request.query_params.get('specialite') or self.request.query_params.get('specialite_id')

        if specialite_id:
            queryset = queryset.filter(specialite_id=specialite_id)
        elif licence_id:
            queryset = queryset.filter(licence_id=licence_id)
        return queryset

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    @action(detail=False, methods=['get'])
    def by_specialite(self, request):
        """Récupère les modules d'une spécialité spécifique"""
        specialite_id = request.query_params.get('specialite_id')
        if specialite_id:
            modules = Module.objects.filter(specialite_id=specialite_id)
            serializer = self.get_serializer(modules, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_licence(self, request):
        """Récupère les modules d'une licence spécifique (toutes spécialités confondues)"""
        licence_id = request.query_params.get('licence_id')
        if licence_id:
            modules = Module.objects.filter(specialite__licence_id=licence_id)
            serializer = self.get_serializer(modules, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_semestre(self, request):
        """Récupère les modules d'un semestre spécifique"""
        semestre = request.query_params.get('semestre')
        specialite_id = request.query_params.get('specialite_id')
        if semestre and specialite_id:
            modules = Module.objects.filter(specialite_id=specialite_id, semestre=semestre)
            serializer = self.get_serializer(modules, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_400_BAD_REQUEST)


class UEElementViewSet(viewsets.ModelViewSet):
    queryset = UEElement.objects.select_related('module', 'enseignant').all()
    serializer_class = UEElementSerializer
    permission_classes = [IsAdminOrChefDepartement]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            queryset = UEElement.objects.select_related('module', 'enseignant')
        else:
            enseignant = getattr(user, 'enseignant', None)
            if not enseignant:
                return UEElement.objects.none()
            role = getattr(enseignant, 'role', '')
            departement = getattr(enseignant, 'departement', None)
            if role == 'admin':
                queryset = UEElement.objects.select_related('module', 'enseignant')
            elif role == 'chef_departement' and departement:
                queryset = UEElement.objects.select_related('module', 'enseignant').filter(
                    Q(module__licence__departement=departement) |
                    Q(module__specialite__licence__departement=departement)
                ).distinct()
            else:
                queryset = UEElement.objects.select_related('module', 'enseignant').filter(enseignant=enseignant)

        module_id = self.request.query_params.get('module') or self.request.query_params.get('module_id')
        specialite_id = self.request.query_params.get('specialite') or self.request.query_params.get('specialite_id')
        licence_id = self.request.query_params.get('licence') or self.request.query_params.get('licence_id')

        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if specialite_id:
            queryset = queryset.filter(module__specialite_id=specialite_id)
        if licence_id:
            queryset = queryset.filter(module__licence_id=licence_id)
        return queryset

from .models import AffectationDetail
from .serializers import AffectationDetailSerializer

class AffectationDetailViewSet(viewsets.ModelViewSet):
    queryset = AffectationDetail.objects.all()
    serializer_class = AffectationDetailSerializer
    permission_classes = [IsAdminOrChefDepartement]

    def get_queryset(self):
        queryset = AffectationDetail.objects.all()
        ue_element_id = self.request.query_params.get('ue_element')
        enseignant_id = self.request.query_params.get('enseignant')
        if ue_element_id:
            queryset = queryset.filter(ue_element_id=ue_element_id)
        if enseignant_id:
            queryset = queryset.filter(enseignant_id=enseignant_id)
        return queryset

