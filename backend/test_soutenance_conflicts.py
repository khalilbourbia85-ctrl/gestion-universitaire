#!/usr/bin/env python
"""
Script simplifié de test pour vérifier les validations de conflits d'horaires.
"""
import os
import django
import sys
from datetime import date, time, datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_universitaire.settings')
django.setup()

from pfes.models import Soutenance, Salle
from enseignants.models import Enseignant
from etudiants.models import Etudiant
from pfes.serializers import SoutenanceSerializer

def clean_test_soutenances():
    """Nettoyer les soutenances de test."""
    test_date = date.today() + timedelta(days=30)
    Soutenance.objects.filter(date_soutenance=test_date).delete()

def test_room_conflict():
    """Test: Vérifier que deux soutenances ne peuvent pas être programmées dans la même salle au même moment."""
    print("\n=== Test 1: Conflit de salle ===")
    
    try:
        clean_test_soutenances()
        
        # Récupérer les données
        salles = list(Salle.objects.all())
        enseignants = list(Enseignant.objects.all())
        
        # Récupérer des étudiants sans soutenance existante
        etudiants_libres = Etudiant.objects.exclude(soutenances__isnull=False)[:3]
        
        if len(enseignants) < 2 or not salles or len(etudiants_libres) < 2:
            print(f"❌ Données insuffisantes: {len(enseignants)} enseignants, {len(salles)} salles, {len(etudiants_libres)} étudiants libres")
            return False
        
        salle = salles[0]
        enc1, enc2 = enseignants[0], enseignants[1] if len(enseignants) > 1 else enseignants[0]
        etu1, etu2 = etudiants_libres[0], etudiants_libres[1]
        
        test_date = date.today() + timedelta(days=30)
        test_time = time(10, 0)
        
        # Créer la première soutenance
        sout1_data = {
            'date_soutenance': test_date,
            'heure_soutenance': test_time,
            'duree': 60,
            'salle': salle.nom,
            'encadrant': enc1.pk,
            'rapporteur': enc2.pk,
            'etudiants': [etu1.pk],
            'type_soutenance': 'finale'
        }
        
        serializer1 = SoutenanceSerializer(data=sout1_data)
        if serializer1.is_valid():
            sout1 = serializer1.save()
            print(f"✓ Soutenance 1 créée: {sout1.idSoutenance}")
        else:
            print(f"❌ Erreur création soutenance 1: {serializer1.errors}")
            return False
        
        # Essayer de créer une deuxième soutenance au même moment dans la même salle
        sout2_data = {
            'date_soutenance': test_date,
            'heure_soutenance': test_time,
            'duree': 60,
            'salle': salle.nom,
            'encadrant': enc2.pk,
            'rapporteur': enc1.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'finale'
        }
        
        serializer2 = SoutenanceSerializer(data=sout2_data)
        if not serializer2.is_valid():
            if 'salle' in serializer2.errors:
                print(f"✓ Conflit de salle détecté correctement: {serializer2.errors['salle']}")
                sout1.delete()
                return True
            else:
                print(f"❌ Erreur non liée à la salle: {serializer2.errors}")
                sout1.delete()
                return False
        else:
            print("❌ La validation n'a pas détecté le conflit de salle")
            sout1.delete()
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_encadrant_conflict():
    """Test: Vérifier qu'un encadrant ne peut pas être assigné à deux soutenances au même moment."""
    print("\n=== Test 2: Conflit d'encadrant ===")
    
    try:
        salles = list(Salle.objects.all())
        enseignants = Enseignant.objects.all()[:3]
        etudiants = Etudiant.objects.all()[:3]
        
        if len(enseignants) < 3 or len(salles) < 2 or len(etudiants) < 3:
            print("❌ Données insuffisantes pour le test")
            return False
        
        enc_shared = enseignants[0]
        enc2 = enseignants[1]
        enc3 = enseignants[2]
        salle1 = salles[0]
        salle2 = salles[1]
        etu1, etu2, etu3 = etudiants[0], etudiants[1], etudiants[2]
        
        test_date = date.today() + timedelta(days=6)
        test_time = time(14, 0)
        
        # Créer la première soutenance avec enc_shared
        sout1_data = {
            'date_soutenance': test_date,
            'heure_soutenance': test_time,
            'duree': 60,
            'salle': salle1.nom,
            'encadrant': enc_shared.pk,
            'rapporteur': enc2.pk,
            'etudiants': [etu1.pk],
            'type_soutenance': 'finale'
        }
        
        serializer1 = SoutenanceSerializer(data=sout1_data)
        if serializer1.is_valid():
            sout1 = serializer1.save()
            print(f"✓ Soutenance 1 avec encadrant: {sout1.idSoutenance}")
        else:
            print(f"❌ Erreur création soutenance 1: {serializer1.errors}")
            return False
        
        # Essayer d'assigner le même encadrant à une autre soutenance au même moment
        sout2_data = {
            'date_soutenance': test_date,
            'heure_soutenance': time(14, 30),  # 30 minutes après, toujours chevauchement
            'duree': 60,
            'salle': salle2.nom,
            'encadrant': enc_shared.pk,  # Même encadrant!
            'rapporteur': enc3.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'finale'
        }
        
        serializer2 = SoutenanceSerializer(data=sout2_data)
        if not serializer2.is_valid():
            if 'encadrant' in serializer2.errors:
                print(f"✓ Conflit d'encadrant détecté correctement: {serializer2.errors['encadrant']}")
                sout1.delete()
                return True
            else:
                print(f"❌ Erreur non liée à l'encadrant: {serializer2.errors}")
                sout1.delete()
                return False
        else:
            print("❌ La validation n'a pas détecté le conflit d'encadrant")
            sout1.delete()
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_rapporteur_conflict():
    """Test: Vérifier qu'un rapporteur ne peut pas être assigné à deux soutenances au même moment."""
    print("\n=== Test 3: Conflit de rapporteur ===")
    
    try:
        salles = list(Salle.objects.all())
        enseignants = Enseignant.objects.all()[:3]
        etudiants = Etudiant.objects.all()[:3]
        
        if len(enseignants) < 3 or len(salles) < 2 or len(etudiants) < 3:
            print("❌ Données insuffisantes pour le test")
            return False
        
        enc1 = enseignants[0]
        enc2 = enseignants[1]
        rap_shared = enseignants[2]
        salle1 = salles[0]
        salle2 = salles[1] if len(salles) > 1 else salle1
        etu1, etu2, etu3 = etudiants[0], etudiants[1], etudiants[2]
        
        test_date = date.today() + timedelta(days=7)
        test_time = time(11, 0)
        
        # Créer la première soutenance avec rap_shared
        sout1_data = {
            'date_soutenance': test_date,
            'heure_soutenance': test_time,
            'duree': 60,
            'salle': salle1.nom,
            'encadrant': enc1.pk,
            'rapporteur': rap_shared.pk,
            'etudiants': [etu1.pk],
            'type_soutenance': 'finale'
        }
        
        serializer1 = SoutenanceSerializer(data=sout1_data)
        if serializer1.is_valid():
            sout1 = serializer1.save()
            print(f"✓ Soutenance 1 avec rapporteur: {sout1.idSoutenance}")
        else:
            print(f"❌ Erreur création soutenance 1: {serializer1.errors}")
            return False
        
        # Essayer d'assigner le même rapporteur à une autre soutenance au même moment
        sout2_data = {
            'date_soutenance': test_date,
            'heure_soutenance': time(11, 45),  # 45 minutes après, toujours chevauchement
            'duree': 60,
            'salle': salle2.nom,
            'encadrant': enc2.pk,
            'rapporteur': rap_shared.pk,  # Même rapporteur!
            'etudiants': [etu2.pk],
            'type_soutenance': 'finale'
        }
        
        serializer2 = SoutenanceSerializer(data=sout2_data)
        if not serializer2.is_valid():
            if 'rapporteur' in serializer2.errors:
                print(f"✓ Conflit de rapporteur détecté correctement: {serializer2.errors['rapporteur']}")
                sout1.delete()
                return True
            else:
                print(f"❌ Erreur non liée au rapporteur: {serializer2.errors}")
                sout1.delete()
                return False
        else:
            print("❌ La validation n'a pas détecté le conflit de rapporteur")
            sout1.delete()
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_no_conflict_different_times():
    """Test: Vérifier que deux soutenances avec les mêmes ressources peuvent être créées si les horaires ne se chevauchent pas."""
    print("\n=== Test 4: Pas de conflit avec horaires différents ===")
    
    try:
        salles = Salle.objects.all()
        enseignants = Enseignant.objects.all()[:2]
        etudiants = Etudiant.objects.all()[:2]
        
        if len(enseignants) < 2 or not salles or len(etudiants) < 2:
            print("❌ Données insuffisantes pour le test")
            return False
        
        enc1, enc2 = enseignants[0], enseignants[1]
        salle = salles[0]
        etu1, etu2 = etudiants[0], etudiants[1]
        
        test_date = date.today() + timedelta(days=8)
        
        # Créer la première soutenance (10:00-11:00)
        sout1_data = {
            'date_soutenance': test_date,
            'heure_soutenance': time(10, 0),
            'duree': 60,
            'salle': salle.nom,
            'encadrant': enc1.pk,
            'rapporteur': enc2.pk,
            'etudiants': [etu1.pk],
            'type_soutenance': 'finale'
        }
        
        serializer1 = SoutenanceSerializer(data=sout1_data)
        if serializer1.is_valid():
            sout1 = serializer1.save()
            print(f"✓ Soutenance 1 créée (10:00-11:00): {sout1.idSoutenance}")
        else:
            print(f"❌ Erreur création soutenance 1: {serializer1.errors}")
            return False
        
        # Créer une deuxième soutenance au même endroit mais après (11:00-12:00)
        sout2_data = {
            'date_soutenance': test_date,
            'heure_soutenance': time(11, 0),  # Commence juste après la première
            'duree': 60,
            'salle': salle.nom,
            'encadrant': enc1.pk,
            'rapporteur': enc2.pk,
            'etudiants': [etu2.pk],
            'type_soutenance': 'finale'
        }
        
        serializer2 = SoutenanceSerializer(data=sout2_data)
        if serializer2.is_valid():
            sout2 = serializer2.save()
            print(f"✓ Soutenance 2 créée (11:00-12:00) sans conflit: {sout2.idSoutenance}")
            sout1.delete()
            sout2.delete()
            return True
        else:
            print(f"❌ La validation a incorrectement rejeté une soutenance sans conflit: {serializer2.errors}")
            sout1.delete()
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("Tests de validation des conflits d'horaires de soutenances")
    print("=" * 60)
    
    results = {
        'Test 1 (Conflit salle)': test_room_conflict(),
        'Test 2 (Conflit encadrant)': test_encadrant_conflict(),
        'Test 3 (Conflit rapporteur)': test_rapporteur_conflict(),
        'Test 4 (Pas de conflit - horaires différents)': test_no_conflict_different_times(),
    }
    
    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "✓ RÉUSSI" if passed_flag else "❌ ÉCHOUÉ"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests réussis")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
