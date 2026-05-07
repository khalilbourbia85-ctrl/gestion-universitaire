import re
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
# import openpyxl

from .models import Enseignant, Diplome, Contractuel
from .serializers import EnseignantSerializer, DiplomeSerializer, ContractuelSerializer


def normalize_header(value):
    if value is None:
        return ''
    header = str(value).strip().lower()
    header = re.sub(r'[\s_\-]+', '', header)
    header = re.sub(r'[^a-z0-9]', '', header)
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

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class DiplomeViewSet(viewsets.ModelViewSet):
    queryset = Diplome.objects.all()
    serializer_class = DiplomeSerializer


class ContractuelViewSet(viewsets.ModelViewSet):
    queryset = Contractuel.objects.all()
    serializer_class = ContractuelSerializer
