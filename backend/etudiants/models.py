from django.db import models

class Etudiant(models.Model):
    idEtudiant = models.AutoField(primary_key=True)
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
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.nom_fr} {self.prenom_fr}"