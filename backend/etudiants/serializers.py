from rest_framework import serializers
from academique.models import Licence, Specialite
from academique.serializers import LicenceSerializer, SpecialiteSerializer

from .models import Etudiant


class EtudiantSerializer(serializers.ModelSerializer):
    licence_detail = LicenceSerializer(source='licence', read_only=True)
    specialite_detail = SpecialiteSerializer(source='specialite', read_only=True)
    licence = serializers.PrimaryKeyRelatedField(
        queryset=Licence.objects.all(),
        allow_null=True,
        required=False,
    )
    specialite = serializers.PrimaryKeyRelatedField(
        queryset=Specialite.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Etudiant
        fields = [
            'idEtudiant',
            'cin',
            'passport',
            'nationalite',
            'nom',
            'prenom',
            'email',
            'numTel',
            'dateNaissance',
            'adresse',
            'situation',
            'groupe',
            'licence',
            'specialite',
            'licence_detail',
            'specialite_detail',
        ]
    def validate_cin(self, value):
        if value:
            import re
            if not re.match(r'^\d{8}$', value):
                raise serializers.ValidationError("Le CIN doit contenir exactement 8 chiffres.")
            queryset = Etudiant.objects.filter(cin=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ce CIN est déjà utilisé par un autre étudiant.")
        return value

    def validate_email(self, value):
        if value:
            if not value.endswith('@gmail.com'):
                raise serializers.ValidationError("L'email doit se terminer par @gmail.com.")
            queryset = Etudiant.objects.filter(email=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Cet email est déjà utilisé par un autre étudiant.")
        return value

    def validate_numTel(self, value):
        if value:
            import re
            if not re.match(r'^\d{8}$', value):
                raise serializers.ValidationError("Le numéro de téléphone doit contenir exactement 8 chiffres.")
        return value

    def validate_passport(self, value):
        if value and value != '':
            # Check if another student has this passport
            queryset = Etudiant.objects.filter(passport=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ce passeport est déjà utilisé par un autre étudiant.")
        return value

    def validate(self, attrs):
        # Convert empty passport to None
        if 'passport' in attrs and attrs['passport'] == '':
            attrs['passport'] = None

        lic = attrs['licence'] if 'licence' in attrs else (self.instance.licence if self.instance else None)
        spec = attrs['specialite'] if 'specialite' in attrs else (self.instance.specialite if self.instance else None)

        if spec is not None:
            if lic is not None and spec.licence_id != lic.pk:
                raise serializers.ValidationError({
                    'specialite': 'La spécialité doit appartenir à la licence choisie.',
                })
            if lic is None:
                attrs['licence'] = spec.licence
        return attrs
