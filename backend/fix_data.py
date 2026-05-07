import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_departements.settings')
django.setup()

from etudiants.models import Etudiant
from enseignants.models import Enseignant
from academique.models import Departement, Licence

def fix_data():
    dept = Departement.objects.first()
    if not dept:
        print("Aucun département trouvé.")
        return

    licence = Licence.objects.filter(departement=dept).first()
    
    # Assigner les étudiants sans licence à la première licence du département
    if licence:
        etudiants = Etudiant.objects.filter(licence__isnull=True)
        count_etudiants = etudiants.update(licence=licence)
        print(f"{count_etudiants} étudiants ont été assignés à la licence {licence.nom} (Département: {dept.nom}).")
    
    # Assigner les enseignants sans département à ce département
    enseignants = Enseignant.objects.filter(departement__isnull=True)
    count_enseignants = enseignants.update(departement=dept)
    print(f"{count_enseignants} enseignants ont été assignés au département {dept.nom}.")

if __name__ == '__main__':
    fix_data()
