from django.contrib import admin
from .models import Departement, Licence, Module


@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'responsable', 'email', 'date_creation']
    list_filter = ['date_creation', 'date_modification']
    search_fields = ['nom', 'code', 'email']
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


@admin.register(Licence)
class LicenceAdmin(admin.ModelAdmin):
    list_display = ('nom', 'domaine', 'mention', 'parcours', 'duree', 'departement', 'date_creation')
    list_filter = ['departement', 'date_creation', 'date_modification']
    search_fields = ('nom', 'domaine', 'mention', 'parcours')
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'domaine', 'mention', 'parcours', 'duree', 'description')
        }),
        ('Affiliation', {
            'fields': ('departement',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'license_name', 'semestre', 'annee', 'credit_ue']
    list_filter = ['licence', 'annee', 'semestre', 'date_creation']
    search_fields = ['nom', 'code']
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'code', 'description')
        }),
        ('Organisation académique', {
            'fields': ('licence', 'annee', 'semestre')
        }),
        ('Détails UE', {
            'fields': ('coefficient_ue', 'credit_ue', 'matieres')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def license_name(self, obj):
        return obj.licence.nom
    license_name.short_description = 'Licence'
