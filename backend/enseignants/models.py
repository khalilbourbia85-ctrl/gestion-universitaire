from django.db import models
from django.contrib.auth.models import User
from academique.models import Departement

class Enseignant(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('chef_departement', 'Chef de Département'),
        ('enseignant', 'Enseignant'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='enseignant')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='enseignant')
    departement = models.ForeignKey(Departement, on_delete=models.SET_NULL, null=True, blank=True, related_name='enseignants')

    matricule = models.CharField(max_length=20, primary_key=True)
    cin = models.CharField(max_length=8, unique=True)
    nom = models.CharField(max_length=20)
    prenom = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    numtel = models.CharField(max_length=20)
    grade = models.CharField(max_length=50)
    dateRecrutement = models.DateField()
    statutAdministratif = models.CharField(max_length=100, blank=True, null=True)
    plafond_pfe = models.PositiveSmallIntegerField(
        default=5,
        help_text='Nombre maximal d\'étudiants/groupes que cet enseignant souhaite encadrer.'
    )

    def __str__(self):
        return f"{self.nom} {self.prenom}"


class Grade(models.Model):
    nomGrade = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nomGrade


class EnseignantGrade(models.Model):
    matricule = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    dateDebut = models.DateField()
    dateFin = models.DateField(blank=True, null=True)

    class Meta:
        unique_together = ('matricule', 'grade', 'dateDebut')


class Diplome(models.Model):
    idDiplome = models.AutoField(primary_key=True)
    libelleDiplome = models.CharField(max_length=100)
    specialite = models.CharField(max_length=100, blank=True)
    universite = models.CharField(max_length=100, blank=True, null=True)
    dateObtention = models.DateField()

    def __str__(self):
        return self.libelleDiplome


class EnseignantDiplome(models.Model):
    matricule = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    idDiplome = models.ForeignKey(Diplome, on_delete=models.CASCADE)
    dateObtention = models.DateField()

    class Meta:
        unique_together = ('matricule', 'idDiplome')


class Titre(models.Model):
    idTitre = models.AutoField(primary_key=True)
    dateDebutTitre = models.DateField()

    enseignant = models.ForeignKey(
        Enseignant,
        on_delete=models.CASCADE,
        related_name="titres"
    )


class Permanent(Titre):
    dateTitularisation = models.DateField()
    anneeInscription = models.IntegerField(blank=True, null=True)


class Vacataire(Titre):
    nbHeures = models.IntegerField()
    tauxHoraire = models.FloatField()


class Contractuel(Titre):
    dureeContrat = models.IntegerField()
    dateDebutContrat = models.DateField()
    dateFinContrat = models.DateField()


class ContratDocteur(models.Model):
    contractuel = models.OneToOneField(
        Contractuel,
        on_delete=models.CASCADE,
        primary_key=True
    )

    primeRecherche = models.FloatField()
    numeroOrdre = models.IntegerField(blank=True, null=True)


class ContratDoctorant(models.Model):
    contractuel = models.OneToOneField(
        Contractuel,
        on_delete=models.CASCADE,
        primary_key=True
    )

    sujetThese = models.CharField(max_length=200)
    universiteInscription = models.CharField(max_length=150)
    anneeInscription = models.IntegerField(blank=True, null=True)
