from rest_framework.routers import DefaultRouter
from .views import EtudiantViewSet

router = DefaultRouter()
router.register(r'etudiants', EtudiantViewSet)

urlpatterns = router.urls