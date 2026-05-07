from rest_framework import serializers
from datetime import datetime, timedelta
from enseignants.contract_rules import enseignant_peut_etre_rapporteur
from enseignants.serializers import EnseignantSerializer
from enseignants.models import Enseignant
from etudiants.serializers import EtudiantSerializer
from etudiants.models import Etudiant
from .charge_balance import (
    count_pfe_encadrant,
    count_soutenance_rapporteur,
    erreur_si_depasse_plafond,
    erreur_si_desiquilibre,
    max_groupes_plafond,
    pfe_total_after_save,
    soutenance_total_after_save,
)
from .models import Rapporteur, PFE, Soutenance
from .salles_soutenance import SALLES_SOUTENANCE


class RapporteurSerializer(serializers.ModelSerializer):
    def validate_cin(self, value):
        if value:
            import re
            if not re.match(r'^\d{8}$', value):
                raise serializers.ValidationError("Le CIN doit contenir exactement 8 chiffres.")
            queryset = Rapporteur.objects.filter(cin=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ce CIN est déjà utilisé par un autre rapporteur.")
        return value

    def validate_email(self, value):
        if value:
            if not value.endswith('@gmail.com'):
                raise serializers.ValidationError("L'email doit se terminer par @gmail.com.")
            queryset = Rapporteur.objects.filter(email=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Cet email est déjà utilisé par un autre rapporteur.")
        return value

    def validate_numtel(self, value):
        if value:
            import re
            if not re.match(r'^\d{8}$', value):
                raise serializers.ValidationError("Le numéro de téléphone doit contenir exactement 8 chiffres.")
        return value

    class Meta:
        model = Rapporteur
        fields = ['matricule', 'cin', 'nom', 'prenom', 'email', 'numtel', 'grade', 'dateRecrutement', 'statutAdministratif']


class PFESerializer(serializers.ModelSerializer):
    etudiants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Etudiant.objects.all(),
    )
    etudiants_detail = EtudiantSerializer(source='etudiants', many=True, read_only=True)
    encadrant = serializers.PrimaryKeyRelatedField(
        queryset=Enseignant.objects.all(),
        allow_null=True,
        required=False
    )
    encadrant_detail = EnseignantSerializer(source='encadrant', read_only=True)

    class Meta:
        model = PFE
        fields = [
            'idPfe',
            'sujet',
            'duree',
            'specialite',
            'etudiants',
            'etudiants_detail',
            'encadrant',
            'encadrant_detail',
            'date_affectation',
            'lieu_stage',
            'convention_file',
            'lettre_affectation_file',
        ]

    def validate_etudiants(self, value):
        if len(value) < 1 or len(value) > 2:
            raise serializers.ValidationError('Un PFE doit avoir 1 ou 2 étudiants.')
        return value

    def validate(self, attrs):
        etudiants = attrs.get('etudiants')
        if self.instance and etudiants is None:
            etudiants = self.instance.etudiants.all()

        if not etudiants:
            raise serializers.ValidationError('La liste des étudiants ne peut pas être vide.')

        for etudiant in etudiants:
            existing_pfe = etudiant.pfes.first()
            if existing_pfe is not None and existing_pfe != self.instance:
                raise serializers.ValidationError(
                    {
                        'etudiants': (
                            f'Chaque étudiant ne peut être supervisé que par un seul encadrant (un seul PFE). '
                            f'{etudiant} est déjà affecté au PFE n°{existing_pfe.idPfe}.'
                        )
                    }
                )

        enc = attrs.get('encadrant')
        if self.instance is not None and 'encadrant' not in attrs:
            enc = self.instance.encadrant
        old_enc = self.instance.encadrant if self.instance else None

        if enc is not None:
            e_fin = pfe_total_after_save(enc, self.instance)
            r_fin = count_soutenance_rapporteur(enc)
            cap = max_groupes_plafond(enc)
            err = erreur_si_depasse_plafond(e_fin, cap, 'encadrant PFE')
            if err:
                raise serializers.ValidationError({'encadrant': err})
            err = erreur_si_desiquilibre(e_fin, r_fin)
            if err:
                raise serializers.ValidationError({'encadrant': err})

        if (
            self.instance
            and old_enc
            and enc
            and old_enc.pk != enc.pk
        ):
            e_old = PFE.objects.filter(encadrant=old_enc).exclude(pk=self.instance.pk).count()
            r_old = count_soutenance_rapporteur(old_enc)
            err = erreur_si_desiquilibre(e_old, r_old)
            if err:
                raise serializers.ValidationError({
                    'encadrant': (
                        f"Changement d'encadrant refusé pour l'ancien encadrant : {err}"
                    )
                })

        return attrs

    def create(self, validated_data):
        etudiants_data = validated_data.pop('etudiants', [])
        pfe = PFE.objects.create(**validated_data)
        pfe.etudiants.set(etudiants_data)
        return pfe

    def update(self, instance, validated_data):
        etudiants_data = validated_data.pop('etudiants', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if etudiants_data is not None:
            instance.etudiants.set(etudiants_data)
        return instance


class SoutenanceSerializer(serializers.ModelSerializer):
    etudiants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Etudiant.objects.all(),
    )
    etudiants_detail = EtudiantSerializer(source='etudiants', many=True, read_only=True)
    encadrant = serializers.PrimaryKeyRelatedField(
        queryset=Enseignant.objects.all(),
    )
    encadrant_detail = EnseignantSerializer(source='encadrant', read_only=True)
    rapporteur = serializers.PrimaryKeyRelatedField(
        queryset=Enseignant.objects.all(),
    )
    rapporteur_detail = EnseignantSerializer(source='rapporteur', read_only=True)
    pfe = serializers.PrimaryKeyRelatedField(
        queryset=PFE.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Soutenance
        fields = [
            'idSoutenance',
            'pfe',
            'date_soutenance',
            'heure_soutenance',
            'duree',
            'salle',
            'encadrant',
            'encadrant_detail',
            'rapporteur',
            'rapporteur_detail',
            'etudiants',
            'etudiants_detail',
        ]
        read_only_fields = ['idSoutenance']

    def validate_salle(self, value):
        v = (value or '').strip()
        if v not in SALLES_SOUTENANCE:
            raise serializers.ValidationError(
                'Choisissez une salle parmi la liste officielle des salles de soutenance.'
            )
        return v

    def validate_rapporteur(self, value):
        if value is not None and not enseignant_peut_etre_rapporteur(value):
            raise serializers.ValidationError(
                "Un enseignant au contrat « Contrat doctorant » ou « Contrat docteur » ne peut pas être rapporteur."
            )
        return value

    def validate(self, attrs):
        # Récupération de tous les champs
        salle = attrs.get('salle')
        date_s = attrs.get('date_soutenance')
        heure_s = attrs.get('heure_soutenance')
        duree = attrs.get('duree')
        enc = attrs.get('encadrant')
        rap = attrs.get('rapporteur')
        etudiants = attrs.get('etudiants')

        if self.instance is not None:
            if salle is None: salle = self.instance.salle
            if date_s is None: date_s = self.instance.date_soutenance
            if heure_s is None: heure_s = self.instance.heure_soutenance
            if duree is None: duree = self.instance.duree
            if enc is None: enc = self.instance.encadrant
            if rap is None: rap = self.instance.rapporteur
            if etudiants is None: etudiants = self.instance.etudiants.all()

        # 1. Étudiants : une seule soutenance
        if etudiants:
            for etudiant in etudiants:
                qs_soutenance = etudiant.soutenances.all()
                if self.instance is not None:
                    qs_soutenance = qs_soutenance.exclude(pk=self.instance.pk)
                if qs_soutenance.exists():
                    raise serializers.ValidationError({
                        'etudiants': f"L'étudiant {etudiant} a déjà une soutenance programmée."
                    })

        # 2. Chevauchement Salles et Enseignants
        if date_s and heure_s and duree is not None:
            from django.db.models import Q
            start_dt = datetime.combine(date_s, heure_s)
            end_dt = start_dt + timedelta(minutes=duree)

            q_conditions = Q()
            if salle:
                q_conditions |= Q(salle=salle)
            if enc:
                q_conditions |= Q(encadrant=enc) | Q(rapporteur=enc)
            if rap:
                q_conditions |= Q(encadrant=rap) | Q(rapporteur=rap)

            if q_conditions:
                soutenances_jour = Soutenance.objects.filter(Q(date_soutenance=date_s) & q_conditions)
                if self.instance is not None:
                    soutenances_jour = soutenances_jour.exclude(pk=self.instance.pk)
                
                for s in soutenances_jour:
                    s_start = datetime.combine(s.date_soutenance, s.heure_soutenance)
                    s_end = s_start + timedelta(minutes=s.duree)
                    
                    if start_dt < s_end and end_dt > s_start:
                        if salle and s.salle == salle:
                            raise serializers.ValidationError({
                                'salle': f"La salle {salle} est déjà réservée de {s_start.strftime('%H:%M')} à {s_end.strftime('%H:%M')}.",
                                'heure_soutenance': "Chevauchement détecté avec une autre soutenance en cours."
                            })
                        if enc and (s.encadrant == enc or s.rapporteur == enc):
                            raise serializers.ValidationError({
                                'encadrant': f"L'encadrant {enc.nom} {enc.prenom} est déjà en soutenance de {s_start.strftime('%H:%M')} à {s_end.strftime('%H:%M')} (salle {s.salle}).",
                                'heure_soutenance': "Un encadrant ne peut pas assurer deux soutenances en même temps."
                            })
                        if rap and (s.encadrant == rap or s.rapporteur == rap):
                            raise serializers.ValidationError({
                                'rapporteur': f"Le rapporteur {rap.nom} {rap.prenom} est déjà en soutenance de {s_start.strftime('%H:%M')} à {s_end.strftime('%H:%M')} (salle {s.salle}).",
                                'heure_soutenance': "Un rapporteur ne peut pas assurer deux soutenances en même temps."
                            })

        old_rap = self.instance.rapporteur if self.instance else None
        if enc and rap and enc.pk == rap.pk:
            raise serializers.ValidationError({
                'rapporteur': "Le rapporteur doit être distinct de l'encadrant."
            })
        pfe = attrs.get('pfe')
        if pfe is not None:
            qs = Soutenance.objects.filter(pfe=pfe)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'pfe': 'Ce PFE est déjà lié à une autre soutenance (relation 1–1). Laissez le champ vide ou choisissez un autre PFE.'
                })

        if rap is not None:
            r_fin = soutenance_total_after_save(rap, self.instance)
            cap = max_groupes_plafond(rap)
            e_cnt = count_pfe_encadrant(rap)
            err = erreur_si_depasse_plafond(r_fin, cap, 'rapporteur de soutenance')
            if err:
                raise serializers.ValidationError({'rapporteur': err})
            err = erreur_si_desiquilibre(e_cnt, r_fin)
            if err:
                raise serializers.ValidationError({'rapporteur': err})

        if (
            self.instance
            and old_rap
            and rap
            and old_rap.pk != rap.pk
        ):
            r_old_fin = (
                Soutenance.objects.filter(rapporteur=old_rap)
                .exclude(pk=self.instance.pk)
                .count()
            )
            e_old = count_pfe_encadrant(old_rap)
            err = erreur_si_desiquilibre(e_old, r_old_fin)
            if err:
                raise serializers.ValidationError({
                    'rapporteur': (
                        f"Changement de rapporteur refusé pour l'ancien rapporteur : {err}"
                    )
                })

        return attrs

    def create(self, validated_data):
        etudiants_data = validated_data.pop('etudiants', [])
        soutenance = Soutenance.objects.create(**validated_data)
        soutenance.etudiants.set(etudiants_data)
        return soutenance

    def update(self, instance, validated_data):
        etudiants_data = validated_data.pop('etudiants', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if etudiants_data is not None:
            instance.etudiants.set(etudiants_data)
        return instance
