from rest_framework import serializers
from .models import Departement, Licence, Specialite, Module


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = [
            'id', 'nom', 'code', 'description', 'responsable',
            'email', 'telephone', 'photo', 'date_creation', 'date_modification'
        ]


class LicenceSerializer(serializers.ModelSerializer):
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)

    class Meta:
        model = Licence
        fields = [
            'id', 'nom', 'domaine', 'mention', 'parcours', 'description', 'duree', 'departement',
            'departement_nom', 'date_creation', 'date_modification'
        ]


class SpecialiteSerializer(serializers.ModelSerializer):
    licence_nom = serializers.CharField(source='licence.nom', read_only=True)
    departement_nom = serializers.CharField(source='licence.departement.nom', read_only=True)

    class Meta:
        model = Specialite
        fields = [
            'id', 'nom', 'code', 'description', 'licence', 'licence_nom',
            'departement_nom', 'date_creation', 'date_modification'
        ]


class ModuleSerializer(serializers.ModelSerializer):
    licence_nom = serializers.CharField(source='licence.nom', read_only=True)
    specialite_nom = serializers.CharField(source='specialite.nom', read_only=True)
    departement_nom = serializers.CharField(source='licence.departement.nom', read_only=True)

    class Meta:
        model = Module
        fields = [
            'id', 'nom', 'code', 'matieres', 'coefficient_ue', 
            'credit_ue', 'semestre', 'annee', 'licence', 'licence_nom', 'specialite',
            'specialite_nom', 'departement_nom', 'description', 'date_creation', 'date_modification'
        ]

    def validate(self, attrs):
        specialite = attrs.get('specialite') or getattr(self.instance, 'specialite', None)
        licence = attrs.get('licence') or getattr(self.instance, 'licence', None)
        if specialite and not licence:
            attrs['licence'] = specialite.licence
        return attrs
