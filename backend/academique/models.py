from django.db import models


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
