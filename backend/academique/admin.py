from django.contrib import admin
from .models import Departement, Licence, Module


# Configuration de l'interface d'administration du modèle Département
@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste des départements
    list_display = ['nom', 'code', 'responsable', 'email', 'date_creation']

    # Filtres disponibles dans l'interface admin
    list_filter = ['date_creation', 'date_modification']

    # Champs utilisés pour la recherche
    search_fields = ['nom', 'code', 'email']

    # Organisation du formulaire en sections
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'description')
        }),
        ('Contact', {
            'fields': ('responsable', 'email', 'telephone')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


# Configuration du modèle Licence
@admin.register(Licence)
class LicenceAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste
    list_display = (
        'nom', 'domaine', 'mention',
        'parcours', 'duree',
        'departement', 'date_creation'
    )

    # Filtres disponibles
    list_filter = ['departement', 'date_creation', 'date_modification']

    # Recherche
    search_fields = ('nom', 'domaine', 'mention', 'parcours')

    # Organisation du formulaire
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'nom', 'domaine',
                'mention', 'parcours',
                'duree', 'description'
            )
        }),
        ('Affiliation', {
            'fields': ('departement',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


# Configuration du modèle Module
@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste des modules
    list_display = [
        'nom', 'code', 'license_name',
        'semestre', 'annee', 'credit_ue'
    ]

    # Filtres
    list_filter = ['licence', 'annee', 'semestre', 'date_creation']

    # Recherche
    search_fields = ['nom', 'code']

    # Organisation du formulaire
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'description')
        }),
        ('Organisation académique', {
            'fields': ('licence', 'annee', 'semestre')
        }),
        ('Détails UE', {
            'fields': (
                'coefficient_ue',
                'credit_ue',
                'matieres'
            )
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )

    # Afficher le nom de la licence au lieu de son ID
    def license_name(self, obj):
        return obj.licence.nom

    # Nom de la colonne dans l'interface admin
    license_name.short_description = 'Licence'