import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_departements.settings')
django.setup()

from academique.models import Departement
from enseignants.models import Enseignant
from django.contrib.auth.models import User

deps = Departement.objects.all()
fixed = 0
for dept in deps:
    if dept.email and dept.code:
        user = User.objects.filter(username=dept.email).first()
        if user:
            ens = Enseignant.objects.filter(email=dept.email).first()
            if not ens:
                ens = Enseignant.objects.filter(user=user).first()
            
            if ens:
                ens.role = 'chef_departement'
                ens.departement = dept
                ens.user = user
                ens.save()
            else:
                try:
                    Enseignant.objects.create(
                        email=dept.email,
                        user=user,
                        nom=dept.responsable or 'Chef',
                        prenom=dept.nom[:20] if dept.nom else 'Département',
                        role='chef_departement',
                        departement=dept,
                        matricule=f"CHEF_{dept.id}",
                        dateRecrutement='2020-01-01',
                        cin=f"CIN_{dept.id}"
                    )
                except Exception as e:
                    print(f"Failed to create for {dept.email}: {e}")
            fixed += 1

print(f"Fixed {fixed} chefs de departements!")
