from datetime import time

from django.db import models
from django.core.exceptions import ValidationError
from enseignants.models import Enseignant
from etudiants.models import Etudiant


class ParametresPfe(models.Model):
    """
    Paramètres globaux PFE (une seule ligne, id=1).
    Le plafond de groupes est identique pour tous les encadrants et rapporteurs.
    """

    plafond_groupes = models.PositiveSmallIntegerField(
        default=5,
        help_text='Nombre maximal de groupes PFE simultanés par encadrant (et même plafond pour rapporteur).',
    )

    class Meta:
        verbose_name = 'Paramètres PFE'
        verbose_name_plural = 'Paramètres PFE'

    def __str__(self):
        return f'Paramètres PFE (plafond {self.plafond_groupes} groupes)'


class Salle(models.Model):
    nom = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name = 'Salle'
        verbose_name_plural = 'Salles'
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Rapporteur(models.Model):
    matricule = models.CharField(max_length=20, primary_key=True)
    cin = models.CharField(max_length=8, unique=True)
    nom = models.CharField(max_length=20)
    prenom = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    numtel = models.CharField(max_length=20)
    grade = models.CharField(max_length=50)
    dateRecrutement = models.DateField()
    statutAdministratif = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.nom} {self.prenom} ({self.matricule})"


class PFE(models.Model):
    idPfe = models.AutoField(primary_key=True)
    sujet = models.CharField(max_length=250)
    duree = models.PositiveIntegerField(help_text='Durée en mois ou unité métier')
    specialite = models.CharField(max_length=150)
    type_projet = models.CharField(max_length=100, null=True, blank=True, help_text='Type de projet pour le PFE')
    encadrant = models.ForeignKey(
        Enseignant,
        on_delete=models.PROTECT,
        related_name='pfes_encadres',
        null=True,
        blank=True
    )
    
    etudiants = models.ManyToManyField(
        Etudiant,
        through='PFEStudent',
        related_name='pfes'
    )
    # Informations relatives aux PFE
    date_affectation = models.DateField(null=True, blank=True)
    lieu_stage = models.CharField(max_length=200, null=True, blank=True)
    convention_file = models.FileField(upload_to='conventions/', null=True, blank=True)
    lettre_affectation_file = models.FileField(upload_to='lettres_affectation/', null=True, blank=True)

    def __str__(self):
        return f"PFE {self.idPfe} - {self.sujet[:40]}"

    def clean(self):
        # Validation pour 1 ou 2 étudiants
        if self.etudiants.count() > 2:
            raise ValidationError('Un PFE ne peut concerner que 1 ou 2 étudiants.')


class PFEStudent(models.Model):
    pfe = models.ForeignKey(PFE, on_delete=models.CASCADE, related_name='participants')
    etudiant = models.OneToOneField(Etudiant, on_delete=models.CASCADE, related_name='pfe_assignment')

    class Meta:
        verbose_name = 'Affectation étudiant PFE'
        verbose_name_plural = 'Affectations étudiants PFE'

    def __str__(self):
        return f"{self.etudiant} -> {self.pfe}"


class Soutenance(models.Model):
    TYPE_SOUTENANCE_CHOICES = [
        ('technique', 'Technique'),
        ('finale', 'Finale'),
    ]

    idSoutenance = models.AutoField(primary_key=True)
    pfe = models.ForeignKey(PFE, on_delete=models.CASCADE, related_name='soutenances', null=True, blank=True)
    type_soutenance = models.CharField(
        max_length=20,
        choices=TYPE_SOUTENANCE_CHOICES,
        default='finale',
        help_text='Type de soutenance (Technique ou Finale).'
    )
    date_soutenance = models.DateField()
    heure_soutenance = models.TimeField(
        default=time(9, 0),
        help_text='Heure exacte de début de la soutenance.',
    )
    duree = models.PositiveIntegerField(
        help_text='Durée en minutes',
        null=True,
        blank=True
    )
    salle = models.CharField(max_length=100)
    encadrant = models.ForeignKey(
        Enseignant,
        on_delete=models.PROTECT,
        related_name='soutenances_encadrees'
    )
    rapporteur = models.ForeignKey(
        Enseignant,
        on_delete=models.PROTECT,
        related_name='soutenances_comme_rapporteur',
        help_text='Enseignant rapporteur (exclut contrat doctorant et contrat docteur).',
    )
    etudiants = models.ManyToManyField(
        Etudiant,
        related_name='soutenances'
    )
    resultat_technique = models.CharField(max_length=100, null=True, blank=True, help_text="Résultat d'évaluation de Soutenance technique")
    resultat_finale = models.CharField(max_length=100, null=True, blank=True, help_text="Résultat d'évaluation de Soutenance finale")
    depot_electronique = models.BooleanField(default=False, help_text='Dépôt électronique effectué (Oui/Non)')
    depot_papier = models.BooleanField(default=False, help_text='Dépôt papier effectué (Oui/Non)')

    def __str__(self):
        return f"Soutenance {self.idSoutenance} - {self.date_soutenance}"

    def save(self, *args, **kwargs):
        """
        Applique une durée par défaut de 60 minutes si elle n'est pas spécifiée.
        Cela garantit que chaque soutenance a une durée définie pour les vérifications de conflit d'horaires.
        """
        if self.duree is None:
            self.duree = 60  # 60 minutes par défaut
        super().save(*args, **kwargs)

    class Meta: 
        ordering = ['-date_soutenance', '-heure_soutenance']
