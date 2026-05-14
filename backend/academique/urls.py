from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartementViewSet, LicenceViewSet, SpecialiteViewSet, ModuleViewSet
from .ai_views import AIChatView

router = DefaultRouter()
router.register(r'departements', DepartementViewSet)
router.register(r'licences', LicenceViewSet)
router.register(r'specialites', SpecialiteViewSet)
router.register(r'modules', ModuleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
]
