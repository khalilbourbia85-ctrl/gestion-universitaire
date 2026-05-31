from django.apps import AppConfig


# Classe de configuration de l'application académique
class AcademiqueConfig(AppConfig):

    # Définit le type de clé primaire générée automatiquement
    # pour les modèles qui ne possèdent pas de champ "id" explicite
    default_auto_field = 'django.db.models.BigAutoField'

    # Nom de l'application Django
    name = 'academique'