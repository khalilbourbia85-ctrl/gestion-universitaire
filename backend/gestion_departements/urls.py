from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as authtoken_views
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('enseignants.urls')),
    path('api/', include('etudiants.urls')),
    path('api/', include('pfes.urls')),
    path('api/', include('academique.urls')),
    path('api-token-auth/', views.CustomAuthToken.as_view()),
    path('api/change-password/', views.ChangePasswordView.as_view()),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
