from django.db import models
from decimal import Decimal


class Departement(models.Model):
    """Modèle pour gérer les départements académiques"""
    nom = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    responsable = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.FileField(upload_to='departements_photos/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']
        verbose_name = "Département"
        verbose_name_plural = "Départements"

    def __str__(self):
        return f"{self.nom} ({self.code})"


class Licence(models.Model):
    """Modèle pour gérer les licences académiques"""
    nom = models.CharField(max_length=255, unique=True)
    domaine = models.CharField(max_length=255, blank=True, null=True)
    mention = models.CharField(max_length=255, blank=True, null=True)
    parcours = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    duree = models.CharField(max_length=50, default="3 ans")
    departement = models.ForeignKey(Departement, on_delete=models.CASCADE, related_name='licences')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']
        verbose_name = "Licence"
        verbose_name_plural = "Licences"

class Specialite(models.Model):
    """Modèle pour gérer les spécialités au sein des licences"""
    nom = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    licence = models.ForeignKey(Licence, on_delete=models.CASCADE, related_name='specialites')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"
        unique_together = ['nom', 'licence']

    def __str__(self):
        return f"{self.nom} ({self.code}) - {self.licence.nom}"


class Module(models.Model):
    """Modèle pour gérer les modules académiques"""
    SEMESTRE_CHOICES = [
        ('S1', 'Semestre 1'),
        ('S2', 'Semestre 2'),
        ('S3', 'Semestre 3'),
        ('S4', 'Semestre 4'),
        ('S5', 'Semestre 5'),
        ('S6', 'Semestre 6'),
    ]
    
    ANNEE_CHOICES = [
        ('L1', 'Licence 1'),
        ('L2', 'Licence 2'),
        ('L3', 'Licence 3'),
    ]
    
    nom = models.CharField(max_length=255, verbose_name="Unité d'Enseignement (UE)")
    code = models.CharField(max_length=50, blank=True, null=True)
    
    # Matieres (ECUEs) - List of objects: { nom, vh_c, vh_td, vh_ci, credit, coefficient }
    matieres = models.JSONField(default=list, blank=True, help_text="Liste des matières (ECUEs) avec leurs volumes, crédits et coefficients")
    
    # Totaux UE
    credit_ue = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Crédits (Total UE)")
    coefficient_ue = models.DecimalField(max_digits=5, decimal_places=2, default=1, help_text="Coefficient (Total UE)")
    
    semestre = models.CharField(max_length=10, choices=SEMESTRE_CHOICES)
    annee = models.CharField(max_length=10, choices=ANNEE_CHOICES)
    licence = models.ForeignKey(Licence, on_delete=models.CASCADE, related_name='modules')
    specialite = models.ForeignKey(Specialite, on_delete=models.CASCADE, related_name='modules', null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['annee', 'semestre', 'nom']
        verbose_name = "Module"
        verbose_name_plural = "Modules"

    def __str__(self):
        return f"{self.nom} ({self.code}) - {self.specialite.nom} - {self.semestre}"


class UEElement(models.Model):
    """Élément constitutif d'une UE / matière à affecter à un enseignant."""
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='ue_elements')
    nom = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    coefficient = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    credit = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vh_c = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Volume horaire Cours')
    vh_td = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Volume horaire TD')
    vh_tp = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Volume horaire TP')
    vh_ci = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Volume horaire CI')
    sections = models.PositiveIntegerField(default=1, verbose_name='Nombre de sections')
    groupes_td = models.PositiveIntegerField(default=1, verbose_name='Nombre de groupes TD')
    sous_groupes_tp = models.PositiveIntegerField(default=1, verbose_name='Nombre de sous-groupes TP')
    etudiants = models.PositiveIntegerField(default=0, verbose_name='Nombre d\'étudiants')
    enseignant = models.ForeignKey('enseignants.Enseignant', on_delete=models.SET_NULL, null=True, blank=True, related_name='ue_elements')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['module__nom', 'nom']
        verbose_name = "Élément UE"
        verbose_name_plural = "Éléments UE"

    def __str__(self):
        label = self.nom or 'Élément UE'
        return f"{label} - {self.module.nom}"

    def total_heures(self):
        return (
            (self.vh_c or Decimal(0)) * (self.sections or 0)
            + (self.vh_td or Decimal(0)) * (self.groupes_td or 0)
            + (self.vh_tp or Decimal(0)) * (self.sous_groupes_tp or 0)
            + (self.vh_ci or Decimal(0)) * (self.sections or 0)
        )

class AffectationDetail(models.Model):
    TYPE_CHOICES = [
        ('C', 'Cours'),
        ('TD', 'TD'),
        ('TP', 'TP'),
        ('CI', 'Cours Intégré')
    ]
    ue_element = models.ForeignKey(UEElement, on_delete=models.CASCADE, related_name='affectations_details')
    enseignant = models.ForeignKey('enseignants.Enseignant', on_delete=models.CASCADE, related_name='affectations_details')
    type_cours = models.CharField(max_length=2, choices=TYPE_CHOICES)
    groupe = models.CharField(max_length=50, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Détail d'affectation"
        verbose_name_plural = "Détails d'affectation"
        unique_together = ['ue_element', 'type_cours', 'groupe']

    def __str__(self):
        return f"{self.ue_element.nom} - {self.type_cours} ({self.groupe}) : {self.enseignant}"
