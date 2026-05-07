import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_departements.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import RequestFactory
from etudiants.views import EtudiantViewSet
from enseignants.views import EnseignantViewSet
from academique.views import DepartementViewSet, LicenceViewSet, ModuleViewSet

def test_chef_views():
    user = User.objects.filter(username='chef1').first()
    if not user:
        print("No chef1 user found!")
        return

    factory = RequestFactory()
    request = factory.get('/')
    request.user = user

    try:
        qs_etud = EtudiantViewSet().get_queryset()
        # need to bind request to view
        view_etud = EtudiantViewSet()
        view_etud.request = request
        print("Etudiants:", view_etud.get_queryset().count())

        view_ens = EnseignantViewSet()
        view_ens.request = request
        print("Enseignants:", view_ens.get_queryset().count())

        view_dep = DepartementViewSet()
        view_dep.request = request
        print("Departements:", view_dep.get_queryset().count())

        view_lic = LicenceViewSet()
        view_lic.request = request
        print("Licences:", view_lic.get_queryset().count())

        view_mod = ModuleViewSet()
        view_mod.request = request
        print("Modules:", view_mod.get_queryset().count())

    except Exception as e:
        print("ERROR:", e)

if __name__ == '__main__':
    test_chef_views()
