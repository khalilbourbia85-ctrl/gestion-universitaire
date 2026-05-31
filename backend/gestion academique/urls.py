from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importation des ViewSets et de la vue IA
from .views import (
    DepartementViewSet,
    LicenceViewSet,
    SpecialiteViewSet,
    ModuleViewSet,
    UEElementViewSet,
    AffectationDetailViewSet
)

from .ai_views import AIChatView


# =====================================
# Création du routeur DRF
# =====================================
# Le DefaultRouter génère automatiquement
# les routes CRUD (GET, POST, PUT, DELETE)
# pour chaque ViewSet enregistré.
router = DefaultRouter()


# =====================================
# Enregistrement des ressources
# =====================================

# Gestion des départements
router.register(
    r'departements',
    DepartementViewSet
)

# Gestion des licences
router.register(
    r'licences',
    LicenceViewSet
)

# Gestion des spécialités
router.register(
    r'specialites',
    SpecialiteViewSet
)

# Gestion des modules (UE)
router.register(
    r'modules',
    ModuleViewSet
)

# Gestion des éléments UE (ECUE)
router.register(
    r'ue-elements',
    UEElementViewSet
)

# Gestion des détails d'affectation
router.register(
    r'affectations-details',
    AffectationDetailViewSet
)

# =====================================
# Définition des URLs de l'application
# =====================================
urlpatterns = [

    # Inclusion automatique des routes CRUD
    # générées par le router
    path('', include(router.urls)),

    # Endpoint dédié au chatbot IA
    path(
        'ai/chat/',
        AIChatView.as_view(),
        name='ai-chat'
    ),
]