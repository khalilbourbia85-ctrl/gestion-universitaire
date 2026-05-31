from django.db import models
from decimal import Decimal

# =========================
# Modèle Département
# =========================
class Departement(models.Model):
    """
    Représente un département académique.
    Contient les informations générales du département
    comme le nom, le code, le responsable et les coordonnées.
    """

    nom = models.CharField(max_length=255, unique=True)  # Nom du département
    code = models.CharField(max_length=50, unique=True)  # Code unique du département
    description = models.TextField(blank=True, null=True)  # Description optionnelle
    responsable = models.CharField(max_length=255, blank=True, null=True)  # Responsable du département
    email = models.EmailField(blank=True, null=True)  # Email de contact
    telephone = models.CharField(max_length=20, blank=True, null=True)  # Numéro de téléphone
    photo = models.FileField(upload_to='departements_photos/', blank=True, null=True)  # Photo du département

    # Dates automatiques
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']  # Tri alphabétique
        verbose_name = "Département"
        verbose_name_plural = "Départements"

    def __str__(self):
        return f"{self.nom} ({self.code})"


# =========================
# Modèle Licence
# =========================
class Licence(models.Model):
    """
    Représente une licence universitaire.
    Chaque licence appartient à un département.
    """

    nom = models.CharField(max_length=255, unique=True)
    domaine = models.CharField(max_length=255, blank=True, null=True)
    mention = models.CharField(max_length=255, blank=True, null=True)
    specialite = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    duree = models.CharField(max_length=50, default="3 ans")

    # Relation plusieurs licences -> un département
    departement = models.ForeignKey(
        Departement,
        on_delete=models.CASCADE,
        related_name='licences'
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']
        verbose_name = "Licence"
        verbose_name_plural = "Licences"


# =========================
# Modèle Spécialité
# =========================
class Specialite(models.Model):
    """
    Représente une spécialité rattachée à une licence.
    Exemple : Informatique de Gestion.
    """

    nom = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    # Relation plusieurs spécialités -> une licence
    licence = models.ForeignKey(
        Licence,
        on_delete=models.CASCADE,
        related_name='specialites'
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"

        # Empêche deux spécialités ayant le même nom dans une même licence
        unique_together = ['nom', 'licence']

    def __str__(self):
        return f"{self.nom} ({self.code}) - {self.licence.nom}"


# =========================
# Modèle Module (UE)
# =========================
class Module(models.Model):
    """
    Représente une Unité d'Enseignement (UE).
    Contient les matières (ECUEs), crédits et coefficients.
    """

    # Liste des semestres disponibles
    SEMESTRE_CHOICES = [
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
        ('S3', 'Semestre 3'),
        ('S4', 'Semestre 4'),
        ('S5', 'Semestre 5'),
        ('S6', 'Semestre 6'),
    ]

    # Liste des années de licence
    ANNEE_CHOICES = [
        ('L1', 'Licence 1'),
        ('L2', 'Licence 2'),
        ('L3', 'Licence 3'),
    ]

    nom = models.CharField(
        max_length=255,
        verbose_name="Unité d'Enseignement (UE)"
    )

    code = models.CharField(max_length=50, blank=True, null=True)

    # Stockage des matières sous format JSON
    matieres = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste des matières (ECUEs)"
    )

    # Informations globales de l'UE
    credit_ue = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    coefficient_ue = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    semestre = models.CharField(max_length=10, choices=SEMESTRE_CHOICES)
    annee = models.CharField(max_length=10, choices=ANNEE_CHOICES)

    # Relations
    licence = models.ForeignKey(
        Licence,
        on_delete=models.CASCADE,
        related_name='modules'
    )

    specialite = models.ForeignKey(
        Specialite,
        on_delete=models.CASCADE,
        related_name='modules',
        null=True,
        blank=True
    )

    description = models.TextField(blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['annee', 'semestre', 'nom']

    def __str__(self):
        return f"{self.nom} ({self.code}) - {self.specialite.nom} - {self.semestre}"


# =========================
# Modèle UEElement (ECUE)
# =========================
class UEElement(models.Model):
    """
    Représente une matière (ECUE) appartenant à une UE.
    Permet également l'affectation d'un enseignant.
    """

    # Relation plusieurs ECUEs -> une UE
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='ue_elements'
    )

    nom = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)

    coefficient = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    credit = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Volumes horaires
    vh_c = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vh_td = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vh_tp = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vh_ci = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Organisation pédagogique
    sections = models.PositiveIntegerField(default=1)
    groupes_td = models.PositiveIntegerField(default=1)
    sous_groupes_tp = models.PositiveIntegerField(default=1)

    etudiants = models.PositiveIntegerField(default=0)

    # Enseignant affecté
    enseignant = models.ForeignKey(
        'enseignants.Enseignant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ue_elements'
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['module__nom', 'nom']

    def __str__(self):
        return f"{self.nom} - {self.module.nom}"

    def total_heures(self):
        """
        Calcule automatiquement la charge horaire totale
        selon le nombre de sections, groupes TD et TP.
        """
        return (
            (self.vh_c or Decimal(0)) * (self.sections or 0)
            + (self.vh_td or Decimal(0)) * (self.groupes_td or 0)
            + (self.vh_tp or Decimal(0)) * (self.sous_groupes_tp or 0)
            + (self.vh_ci or Decimal(0)) * (self.sections or 0)
        )


# =========================
# Modèle AffectationDetail
# =========================
class AffectationDetail(models.Model):
    """
    Permet de détailler l'affectation des enseignants
    par matière et type d'enseignement.
    """

    TYPE_CHOICES = [
        ('C', 'Cours'),
        ('TD', 'TD'),
        ('TP', 'TP'),
        ('CI', 'Cours Intégré')
    ]

    # Matière concernée
    ue_element = models.ForeignKey(
        UEElement,
        on_delete=models.CASCADE,
        related_name='affectations_details'
    )

    # Enseignant affecté
    enseignant = models.ForeignKey(
        'enseignants.Enseignant',
        on_delete=models.CASCADE,
        related_name='affectations_details'
    )

    type_cours = models.CharField(max_length=2, choices=TYPE_CHOICES)

    # Groupe concerné
    groupe = models.CharField(max_length=50, blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        # Empêche la duplication d'affectation
        unique_together = ['ue_element', 'type_cours', 'groupe']

    def __str__(self):
        return f"{self.ue_element.nom} - {self.type_cours} ({self.groupe}) : {self.enseignant}"