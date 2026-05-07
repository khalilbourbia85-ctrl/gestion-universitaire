import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_departements.settings')
django.setup()

from enseignants.models import Enseignant
from etudiants.models import Etudiant

chef = Enseignant.objects.filter(role='chef_departement').first()
print(f"Chef: {chef.nom} {chef.prenom}, Dept: {chef.departement}")

etudiants_orphans = Etudiant.objects.filter(licence__isnull=True).count()
etudiants_linked = Etudiant.objects.filter(licence__isnull=False).count()
print(f"Etudiants: {etudiants_orphans} orphelins, {etudiants_linked} lies")

enseignants_orphans = Enseignant.objects.filter(departement__isnull=True).count()
enseignants_linked = Enseignant.objects.filter(departement__isnull=False).count()
print(f"Enseignants: {enseignants_orphans} orphelins, {enseignants_linked} lies")
