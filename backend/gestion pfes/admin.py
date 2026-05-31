from django.contrib import admin
from .models import ParametresPfe, Rapporteur, PFE, PFEStudent, Soutenance


@admin.register(ParametresPfe)
class ParametresPfeAdmin(admin.ModelAdmin):
    list_display = ('id', 'plafond_groupes')


@admin.register(Rapporteur)
class RapporteurAdmin(admin.ModelAdmin):
    list_display = ('matricule', 'nom', 'prenom', 'email', 'grade')
    search_fields = ('matricule', 'cin', 'nom', 'prenom', 'email')


@admin.register(PFE)
class PFEAdmin(admin.ModelAdmin):
    list_display = ('idPfe', 'sujet', 'specialite', 'duree', 'encadrant')
    raw_id_fields = ('encadrant',)


@admin.register(PFEStudent)
class PFEStudentAdmin(admin.ModelAdmin):
    list_display = ('pfe', 'etudiant')


@admin.register(Soutenance)
class SoutenanceAdmin(admin.ModelAdmin):
    list_display = ('idSoutenance', 'date_soutenance', 'heure_soutenance', 'salle', 'pfe', 'encadrant', 'rapporteur')
    raw_id_fields = ('pfe', 'encadrant', 'rapporteur')
    filter_horizontal = ('etudiants',)
