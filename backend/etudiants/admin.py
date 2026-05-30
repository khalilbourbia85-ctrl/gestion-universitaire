from django.contrib import admin
from .models import Etudiant

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ('cin', 'nom_fr', 'prenom_fr', 'email', 'licence', 'specialite', 'passport', 'nationalite')
    list_filter = ('licence', 'specialite')
    raw_id_fields = ('licence', 'specialite')