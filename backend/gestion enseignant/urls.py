from rest_framework.routers import DefaultRouter
from .views import EnseignantViewSet, DiplomeViewSet, ContractuelViewSet

router = DefaultRouter()
router.register(r'enseignants', EnseignantViewSet)
router.register(r'diplomes', DiplomeViewSet)
router.register(r'contrats', ContractuelViewSet)

urlpatterns = router.urls
