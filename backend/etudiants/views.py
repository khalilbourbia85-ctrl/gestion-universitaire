from rest_framework import viewsets
from django.db.models import Q
from .models import Etudiant
from .serializers import EtudiantSerializer


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
        from rest_framework import status
        from rest_framework.response import Response
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Impossible de supprimer cet étudiant car il est assigné à un PFE."},
                status=status.HTTP_400_BAD_REQUEST
            )
