"""
Module Modèles pour la gestion des étudiants.

Ce module définit le modèle Etudiant qui représente un étudiant de l'université.
Les étudiants sont liés aux licences et spécialités académiques.
"""

from django.db import models


class Etudiant(models.Model):
    """
    Modèle représentant un étudiant dans le système.
    
    Un étudiant a:
    - Identité (CIN, nom, prénom)
    - Coordonnées (email, téléphone, adresse)
    - Informations académiques (licence, spécialité, année)
    - Statut (nouveau ou redoublant)
    - Genre et date de naissance
    
    Les étudiants peuvent être assignés à des PFEs (projets de fin d'études).
    """
    
    idEtudiant = models.AutoField(primary_key=True)
    # Identifiant unique: CIN (Carte d'Identité Nationale) - 8 caractères maximum
    cin = models.CharField(max_length=8, unique=True)

    passport = models.CharField(max_length=20, null=True, blank=True)
    nationalite = models.CharField(max_length=50, null=True, blank=True)

    nom_fr = models.CharField(max_length=100)
    prenom_fr = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    numTel = models.CharField(max_length=20)
    dateNaissance = models.DateField()
    adresse = models.CharField(max_length=100)

    GENRE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    genre = models.CharField(
        max_length=1,
        choices=GENRE_CHOICES,
        default='M'
    )

    SITUATION_CHOICES = [
        ('N', 'Nouveau'),
        ('R', 'Redoublant'),
    ]
    situation_s5 = models.CharField(
        max_length=1, 
        choices=SITUATION_CHOICES, 
        default='N'
    )
    situation_pfe = models.CharField(
        max_length=1, 
        choices=SITUATION_CHOICES, 
        default='N'
    )
    annee_universitaire = models.CharField(max_length=9, default='2025/2026')
    groupe = models.CharField(max_length=50, null=True, blank=True)

    licence = models.ForeignKey(
        'academique.Licence',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etudiants',
    )
    specialite = models.ForeignKey(
        'academique.Specialite',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etudiants',
    )

    def delete(self, *args, **kwargs):
        # Delete the PFE completely if the student is deleted
        try:
            if hasattr(self, 'pfe_assignment') and self.pfe_assignment and self.pfe_assignment.pfe:
                self.pfe_assignment.pfe.delete()
        except Exception:
            pass
        
        # Delete any remaining soutenances linked to this student
        try:
            for soutenance in self.soutenances.all():
                soutenance.delete()
        except Exception:
            pass
            
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.nom_fr} {self.prenom_fr}"