#!/usr/bin/env python
"""
Test direct de la fonction _check_scheduling_conflicts
"""
import os
import django
from datetime import date, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_universitaire.settings')
django.setup()

from pfes.serializers import SoutenanceSerializer
from pfes.models import Soutenance, Salle
from enseignants.models import Enseignant
from etudiants.models import Etudiant

print("=" * 60)
print("TEST RAPIDE: Validations de conflits d'horaires")
print("=" * 60)

# Récupérer les données
salles = list(Salle.objects.all())
enseignants = list(Enseignant.objects.all())
# Récupérer des étudiants qui n'ont AUCUNE soutenance
etudiants_libres = list(Etudiant.objects.exclude(soutenances__type_soutenance='technique')[:5])

print(f"\n✓ Données disponibles:")
print(f"  - {len(salles)} salles")
print(f"  - {len(enseignants)} enseignants")
print(f"  - {len(etudiants_libres)} étudiants")

if len(enseignants) < 2 or len(salles) < 2 or len(etudiants_libres) < 2:
    print("\n❌ Données insuffisantes pour les tests")
else:
    enc1, enc2 = enseignants[0], enseignants[1]
    salle1, salle2 = salles[0], salles[1]
    etu1, etu2 = etudiants_libres[0], etudiants_libres[1]
    
    test_date = date(2026, 6, 15)  # Date fixe pour éviter les conflits avec les données existantes
    
    print(f"\n✓ Utilisation des ressources:")
    print(f"  - Encadrant 1: {enc1.nom} {enc1.prenom}")
    print(f"  - Encadrant 2: {enc2.nom} {enc2.prenom}")
    print(f"  - Salle 1: {salle1.nom}")
    print(f"  - Salle 2: {salle2.nom}")
    print(f"  - Étudiant 1: {etu1.nom_fr} {etu1.prenom_fr}")
    print(f"  - Étudiant 2: {etu2.nom_fr} {etu2.prenom_fr}")
    print(f"  - Date test: {test_date}")
    
    # TEST 1: Créer une première soutenance
    print(f"\n--- TEST 1: Création soutenance 1 (10:00-11:00) ---")
    data1 = {
        'date_soutenance': test_date,
        'heure_soutenance': time(10, 0),
        'duree': 60,
        'salle': salle1.nom,
        'encadrant': enc1.pk,
        'rapporteur': enc2.pk,
        'etudiants': [etu1.pk],
        'type_soutenance': 'technique'
    }
    
    serializer1 = SoutenanceSerializer(data=data1)
    if serializer1.is_valid():
        sout1 = serializer1.save()
        print(f"✓ Soutenance 1 créée avec succès: ID {sout1.idSoutenance}")
        
        # TEST 2: Essayer conflit salle
        print(f"\n--- TEST 2: Tentative conflit salle (même salle, 10:00-11:00) ---")
        data2 = {
            'date_soutenance': test_date,
            'heure_soutenance': time(10, 0),
            'duree': 60,
            'salle': salle1.nom,  # MÊME SALLE
            'encadrant': enc2.pk,
            'rapporteur': enc1.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'technique'
        }
        
        serializer2 = SoutenanceSerializer(data=data2)
        if serializer2.is_valid():
            print("❌ Conflit salle non détecté!")
        else:
            if 'salle' in serializer2.errors:
                print(f"✓ Conflit salle détecté! Erreur: {serializer2.errors['salle'][:80]}...")
            else:
                print(f"⚠ Erreur détectée mais pas sur 'salle': {serializer2.errors}")
        
        # TEST 3: Essayer conflit encadrant
        print(f"\n--- TEST 3: Tentative conflit encadrant (10:30-11:30) ---")
        data3 = {
            'date_soutenance': test_date,
            'heure_soutenance': time(10, 30),  # Chevauchement
            'duree': 60,
            'salle': salle2.nom,  # SALLE DIFFÉRENTE
            'encadrant': enc1.pk,  # MÊME ENCADRANT que sout1
            'rapporteur': enc2.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'technique'
        }
        
        serializer3 = SoutenanceSerializer(data=data3)
        if serializer3.is_valid():
            print("❌ Conflit encadrant non détecté!")
        else:
            if 'encadrant' in serializer3.errors:
                print(f"✓ Conflit encadrant détecté! Erreur: {serializer3.errors['encadrant'][:80]}...")
            else:
                print(f"⚠ Erreur détectée mais pas sur 'encadrant': {serializer3.errors}")
        
        # TEST 4: Créer sans conflit (11:00-12:00)
        print(f"\n--- TEST 4: Création sans conflit (11:00-12:00, même salle) ---")
        data4 = {
            'date_soutenance': test_date,
            'heure_soutenance': time(11, 0),  # PAS DE CHEVAUCHEMENT
            'duree': 60,
            'salle': salle1.nom,
            'encadrant': enc1.pk,
            'rapporteur': enc2.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'technique'
        }
        
        serializer4 = SoutenanceSerializer(data=data4)
        if serializer4.is_valid():
            sout4 = serializer4.save()
            print(f"✓ Soutenance 2 créée sans conflit: ID {sout4.idSoutenance}")
            sout4.delete()
        else:
            print(f"❌ Erreur non justifiée: {serializer4.errors}")
        
        # Cleanup
        sout1.delete()
        
        print(f"\n{'=' * 60}")
        print("✓ Tests complétés!")
        print(f"{'=' * 60}")
    else:
        print(f"❌ Erreur création soutenance 1: {serializer1.errors}")
