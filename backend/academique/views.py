from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Q
# import openpyxl
import re

from .models import Departement, Licence, Specialite, Module
from .models import Departement, Licence, Specialite, Module, UEElement
from .serializers import DepartementSerializer, LicenceSerializer, SpecialiteSerializer, ModuleSerializer, UEElementSerializer
from rest_framework.permissions import BasePermission

class IsAdminOrChefDepartement(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            enseignant = getattr(request.user, 'enseignant', None)
            if not enseignant:
                return False
            role = getattr(enseignant, 'role', '')
            return role in ['admin', 'chef_departement']
        except Exception:
            return False
def normalize_header(value):
    if value is None:
        return ''
    header = str(value).strip().lower()
    header = re.sub(r'[\s_\-]+', '', header)
    return header


# def parse_excel_rows(uploaded_file):
#     workbook = openpyxl.load_workbook(uploaded_file, data_only=True)
#     sheet = workbook.active
#     rows = list(sheet.iter_rows(values_only=True))
#     if not rows:
#         return [], ['Le fichier Excel est vide.']
# 
#     headers = [normalize_header(cell) for cell in rows[0]]
#     parsed = []
# 
#     for row_index, row in enumerate(rows[1:], start=2):
#         if not any(row):
#             continue
#         entry = {}
#         for header, cell in zip(headers, row):
#             if cell is None:
#                 continue
#             entry[header] = str(cell).strip()
#         parsed.append((row_index, entry))
# 
#     return parsed, []


class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Departement.objects.all()
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Departement.objects.none()
        role = getattr(enseignant, 'role', '')
        if role == 'admin':
            return Departement.objects.all()
        elif role == 'chef_departement' and enseignant.departement_id:
            return Departement.objects.filter(id=enseignant.departement_id)
        return Departement.objects.none()

    def perform_create(self, serializer):
        dept = serializer.save()
        if dept.email and dept.code:
            from django.contrib.auth.models import User
            from enseignants.models import Enseignant
            user, created = User.objects.get_or_create(
                username=dept.email,
                defaults={'email': dept.email}
            )
            user.set_password(dept.code)
            user.save()
            
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

    def perform_update(self, serializer):
        old_dept = self.get_object()
        old_email = old_dept.email
        dept = serializer.save()

        if dept.email and dept.code:
            from django.contrib.auth.models import User
            from enseignants.models import Enseignant
            user = None
            if old_email:
                user = User.objects.filter(username=old_email).first()
            if not user:
                user = User.objects.filter(username=dept.email).first()
                
            if user:
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

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class SpecialiteViewSet(viewsets.ModelViewSet):
    queryset = Specialite.objects.all()
    serializer_class = SpecialiteSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Specialite.objects.all()
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Specialite.objects.none()
        role = getattr(enseignant, 'role', '')
        if role == 'admin':
            return Specialite.objects.all()
        elif role == 'chef_departement' and enseignant.departement_id:
            return Specialite.objects.filter(
                Q(licence__departement_id=enseignant.departement_id) | 
                Q(licence__isnull=True)
            )
        return Specialite.objects.none()

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    @action(detail=False, methods=['get'])
    def by_licence(self, request):
        """Récupère les spécialités d'une licence spécifique"""
        licence_id = request.query_params.get('licence_id')
        if licence_id:
            specialites = Specialite.objects.filter(licence_id=licence_id)
            serializer = self.get_serializer(specialites, many=True)
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
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
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

