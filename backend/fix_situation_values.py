#!/usr/bin/env python
"""
Script to fix invalid situation_s5 and situation_pfe values in the database.
Replaces any non-'N' or 'R' values with 'N' (default: Nouveau).
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_universitaire.settings')
django.setup()

from etudiants.models import Etudiant

def fix_situation_values():
    """Fix all invalid situation values in Etudiant model."""
    
    # Find all invalid records for situation_s5
    invalid_s5 = Etudiant.objects.exclude(
        situation_s5__in=['N', 'R']
    )
    
    print(f"Found {invalid_s5.count()} students with invalid situation_s5 values")
    
    for etudiant in invalid_s5:
        print(f"Fixing {etudiant.nom_fr} {etudiant.prenom_fr}: situation_s5={etudiant.situation_s5} -> N")
        etudiant.situation_s5 = 'N'
        etudiant.save()
    
    # Find all invalid records for situation_pfe
    invalid_pfe = Etudiant.objects.exclude(
        situation_pfe__in=['N', 'R']
    )
    
    print(f"\nFound {invalid_pfe.count()} students with invalid situation_pfe values")
    
    for etudiant in invalid_pfe:
        print(f"Fixing {etudiant.nom_fr} {etudiant.prenom_fr}: situation_pfe={etudiant.situation_pfe} -> N")
        etudiant.situation_pfe = 'N'
        etudiant.save()
    
    print("\n✅ All situation values have been fixed!")

if __name__ == '__main__':
    fix_situation_values()
