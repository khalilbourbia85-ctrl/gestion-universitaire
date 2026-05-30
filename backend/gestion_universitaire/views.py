# Import de la vue de base pour l'authentification par token
from rest_framework.authtoken.views import ObtainAuthToken

# Modèle Token utilisé pour stocker le token de chaque utilisateur
from rest_framework.authtoken.models import Token

# Pour retourner des réponses JSON
from rest_framework.response import Response

# Permission pour autoriser tout le monde à accéder au login
from rest_framework.permissions import AllowAny


# =========================
# AUTHENTIFICATION (LOGIN)
# =========================
class CustomAuthToken(ObtainAuthToken):
    """
    Vue personnalisée pour gérer l'authentification.
    Elle retourne le token + informations supplémentaires sur l'utilisateur.
    """

    # Autoriser tout utilisateur (même non connecté) à accéder au login
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Méthode appelée lors du login (POST /login/)
        """

        # Vérifier les données envoyées (username + password)
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        # Récupérer l'utilisateur authentifié
        user = serializer.validated_data['user']

        # Créer ou récupérer le token de cet utilisateur
        token, created = Token.objects.get_or_create(user=user)

        # Valeurs par défaut
        role = 'enseignant'
        departement_id = None
        matricule = None

        # Vérifier si l'utilisateur est admin
        if user.is_superuser:
            role = 'admin'

        # Vérifier si l'utilisateur est un enseignant lié à un profil enseignant
        elif hasattr(user, 'enseignant'):
            role = user.enseignant.role
            departement_id = user.enseignant.departement_id
            matricule = user.enseignant.matricule

        # Retourner la réponse au frontend
        return Response({
            'token': token.key,
            'role': role,
            'departement_id': departement_id,
            'matricule': matricule,
            'user_id': user.pk,
            'email': user.email
        })


# =========================
# CHANGEMENT DE MOT DE PASSE
# =========================
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


class ChangePasswordView(APIView):
    """
    Vue pour permettre à un utilisateur connecté
    de changer son mot de passe.
    """

    # L'utilisateur doit être authentifié (avoir un token valide)
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Méthode appelée lors du changement de mot de passe
        """

        # Récupérer l'utilisateur connecté via le token
        user = request.user

        # Récupérer les données envoyées
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        # Vérifier que les champs ne sont pas vides
        if not old_password or not new_password:
            return Response(
                {'error': 'Ancien et nouveau mots de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si l'ancien mot de passe est correct
        if not user.check_password(old_password):
            return Response(
                {'error': 'Ancien mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Changer le mot de passe (hashé automatiquement)
        user.set_password(new_password)
        user.save()

        # =========================================
        # Cas spécial : chef de département
        # =========================================
        if (
            hasattr(user, 'enseignant')
            and user.enseignant.role == 'chef_departement'
            and user.enseignant.departement
        ):
            try:
                dept = user.enseignant.departement

                # Mise à jour du code du département
                # (ici lié au nouveau mot de passe)
                dept.code = new_password
                dept.save()

            except Exception as e:
                # Erreur possible si le code est déjà utilisé (unique=True)
                return Response(
                    {
                        'error': 'Erreur lors de la mise à jour du code département. '
                                 'Ce mot de passe/code est peut-être déjà utilisé.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Message de succès
        return Response({
            'message': 'Mot de passe modifié avec succès.'
        })