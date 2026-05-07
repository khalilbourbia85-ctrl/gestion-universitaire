from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        role = 'enseignant'
        departement_id = None
        matricule = None
        
        if user.is_superuser:
            role = 'admin'
        elif hasattr(user, 'enseignant'):
            role = user.enseignant.role
            departement_id = user.enseignant.departement_id
            matricule = user.enseignant.matricule
            
        return Response({
            'token': token.key,
            'role': role,
            'departement_id': departement_id,
            'matricule': matricule,
            'user_id': user.pk,
            'email': user.email
        })

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Ancien et nouveau mots de passe requis.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Ancien mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Update departement code if user is a chef_departement
        if hasattr(user, 'enseignant') and user.enseignant.role == 'chef_departement' and user.enseignant.departement:
            try:
                dept = user.enseignant.departement
                dept.code = new_password
                dept.save()
            except Exception as e:
                # Catch potential IntegrityError since 'code' is unique=True
                return Response({'error': 'Erreur lors de la mise à jour du code département. Ce mot de passe/code est peut-être déjà utilisé par un autre département.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Mot de passe modifié avec succès.'})
