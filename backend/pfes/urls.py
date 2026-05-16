from rest_framework.routers import DefaultRouter
from .views import PFEViewSet, RapporteurViewSet, SoutenanceViewSet, SalleViewSet

router = DefaultRouter()
router.register(r'pfes', PFEViewSet, basename='pfe')
router.register(r'rapporteurs', RapporteurViewSet, basename='rapporteur')
router.register(r'soutenances', SoutenanceViewSet, basename='soutenance')
router.register(r'salles', SalleViewSet, basename='salle')

urlpatterns = router.urls
