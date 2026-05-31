"""
Serializers pour le module Enseignants.

Convertissent les modèles Enseignant, Diplôme, et Contrats vers JSON.
Incluent les informations académiques et contractuelles complètes.
"""

from datetime import datetime, date

from rest_framework import serializers
from .contract_rules import get_enseignant_contract_type_label
from .models import (
    Enseignant, Diplome, EnseignantDiplome, Titre, Permanent, Vacataire,
    Contractuel, ContratDoctorant, ContratDocteur,
)


class DiplomeSerializer(serializers.ModelSerializer):
    """Serializer pour les diplômes (formations académiques)."""
    class Meta:
        model = Diplome
        fields = '__all__'


class ContractuelSerializer(serializers.ModelSerializer):
    """
    Serializer pour les enseignants contractuels.
    Agrège les informations du type de contrat (doctorant ou docteur).
    """
    matricule = serializers.CharField(source='enseignant.matricule', read_only=True)
    nom = serializers.CharField(source='enseignant.nom', read_only=True)
    prenom = serializers.CharField(source='enseignant.prenom', read_only=True)
    typeContrat = serializers.SerializerMethodField()
    sujetThese = serializers.SerializerMethodField()
    universite = serializers.SerializerMethodField()
    primeRecherche = serializers.SerializerMethodField()
    numeroOrdre = serializers.SerializerMethodField()
    anneeInscription = serializers.SerializerMethodField()

    def get_typeContrat(self, obj):
        if hasattr(obj, 'contratdoctorant'):
            return 'ContratDoctorant'
        elif hasattr(obj, 'contratdocteur'):
            return 'ContratDocteur'
        else:
            return 'Contractuel'

    def get_sujetThese(self, obj):
        if hasattr(obj, 'contratdoctorant'):
            return obj.contratdoctorant.sujetThese
        return None

    def get_universite(self, obj):
        if hasattr(obj, 'contratdoctorant'):
            return obj.contratdoctorant.universiteInscription
        return None

    def get_primeRecherche(self, obj):
        if hasattr(obj, 'contratdocteur'):
            return obj.contratdocteur.primeRecherche
        return None

    def get_numeroOrdre(self, obj):
        if hasattr(obj, 'contratdocteur'):
            return obj.contratdocteur.numeroOrdre
        return None

    def get_anneeInscription(self, obj):
        if hasattr(obj, 'contratdoctorant'):
            return obj.contratdoctorant.anneeInscription
        return None

    class Meta:
        model = Contractuel
        fields = ['matricule', 'nom', 'prenom', 'dateDebutTitre', 'dateDebutContrat', 'dateFinContrat', 'dureeContrat', 'typeContrat', 'sujetThese', 'universite', 'primeRecherche', 'numeroOrdre', 'anneeInscription']


class EnseignantSerializer(serializers.ModelSerializer):
    diplome = serializers.SerializerMethodField()
    typeContrat = serializers.SerializerMethodField()
    dateDebut = serializers.SerializerMethodField()
    dateFin = serializers.SerializerMethodField()
    dateTitularisation = serializers.SerializerMethodField()
    anneeInscription = serializers.SerializerMethodField()
    nbHeures = serializers.SerializerMethodField()
    tauxHoraire = serializers.SerializerMethodField()
    dureeContrat = serializers.SerializerMethodField()
    sujetThese = serializers.SerializerMethodField()
    universite = serializers.SerializerMethodField()
    primeRecherche = serializers.SerializerMethodField()
    numeroOrdre = serializers.SerializerMethodField()
    
    # Normaliser numtel vers numTel pour la cohérence frontend
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Assurer la cohérence du nom de champ telephone
        if 'numtel' in data:
            data['numTel'] = data['numtel']
        return data

    def _normalize_date(self, value):
        if value is None or value == "":
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str):
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
        return value

    def to_internal_value(self, data):
        data = data.copy() if isinstance(data, dict) else dict(data)
        if 'numTel' in data:
            data['numtel'] = data.get('numTel')

        if 'dateRecrutement' in data:
            data['dateRecrutement'] = self._normalize_date(data.get('dateRecrutement'))
            # Validation: dateRecrutement ne doit pas être dans le futur
            if data['dateRecrutement'] and isinstance(data['dateRecrutement'], date):
                if data['dateRecrutement'] > date.today():
                    raise serializers.ValidationError({'dateRecrutement': 'La date de recrutement ne peut pas être dans le futur.'})
        
        if 'dateTitularisation' in data:
            data['dateTitularisation'] = self._normalize_date(data.get('dateTitularisation'))
            # Validation: dateTitularisation ne doit pas être dans le futur
            if data['dateTitularisation'] and isinstance(data['dateTitularisation'], date):
                if data['dateTitularisation'] > date.today():
                    raise serializers.ValidationError({'dateTitularisation': 'La date de titularisation ne peut pas être dans le futur.'})
        
        if 'dateDebut' in data:
            data['dateDebut'] = self._normalize_date(data.get('dateDebut'))
        if 'dateFin' in data:
            data['dateFin'] = self._normalize_date(data.get('dateFin'))
        if data.get('diplome') and isinstance(data['diplome'], dict):
            data['diplome'] = {
                **data['diplome'],
                'dateObtention': self._normalize_date(data['diplome'].get('dateObtention'))
            }
            # Validation: dateObtention du diplôme ne doit pas être dans le futur
            if data['diplome']['dateObtention'] and isinstance(data['diplome']['dateObtention'], date):
                if data['diplome']['dateObtention'] > date.today():
                    raise serializers.ValidationError({'diplome': {'dateObtention': 'La date d\'obtention du diplôme ne peut pas être dans le futur.'}})

        # Nettoyage des champs numériques (pour éviter "3ans" au lieu de "3")
        import re
        for num_field in ['dureeContrat', 'anneeInscription', 'nbHeures', 'numeroOrdre']:
            if data.get(num_field):
                try:
                    val_str = str(data.get(num_field))
                    digits = re.sub(r'[^\d]', '', val_str)
                    if digits:
                        data[num_field] = int(digits)
                    else:
                        data[num_field] = None
                except ValueError:
                    raise serializers.ValidationError({num_field: "Doit être un nombre entier valide."})
            else:
                data[num_field] = None

        for float_field in ['tauxHoraire', 'primeRecherche']:
            if data.get(float_field):
                try:
                    val_str = str(data.get(float_field)).replace(',', '.')
                    digits = re.sub(r'[^\d\.]', '', val_str)
                    if digits:
                        data[float_field] = float(digits)
                    else:
                        data[float_field] = None
                except ValueError:
                    raise serializers.ValidationError({float_field: "Doit être un nombre décimal valide."})
            else:
                data[float_field] = None

        internal = super().to_internal_value(data)
        internal['diplome'] = data.get('diplome')
        internal['typeContrat'] = data.get('typeContrat')
        internal['dateDebut'] = data.get('dateDebut')
        internal['dateFin'] = data.get('dateFin')
        internal['dateTitularisation'] = data.get('dateTitularisation')
        internal['anneeInscription'] = data.get('anneeInscription')
        internal['nbHeures'] = data.get('nbHeures')
        internal['tauxHoraire'] = data.get('tauxHoraire')
        internal['dureeContrat'] = data.get('dureeContrat')
        internal['sujetThese'] = data.get('sujetThese')
        internal['universite'] = data.get('universite')
        internal['primeRecherche'] = data.get('primeRecherche')
        internal['numeroOrdre'] = data.get('numeroOrdre')
        return internal

    def create(self, validated_data):
        diplome_data = validated_data.pop('diplome', None)
        contract_data = {
            'typeContrat': validated_data.pop('typeContrat', None),
            'dateDebut': validated_data.pop('dateDebut', None),
            'dateFin': validated_data.pop('dateFin', None),
            'dateTitularisation': validated_data.pop('dateTitularisation', None),
            'anneeInscription': validated_data.pop('anneeInscription', None),
            'nbHeures': validated_data.pop('nbHeures', None),
            'tauxHoraire': validated_data.pop('tauxHoraire', None),
            'dureeContrat': validated_data.pop('dureeContrat', None),
            'sujetThese': validated_data.pop('sujetThese', None),
            'universite': validated_data.pop('universite', None),
            'primeRecherche': validated_data.pop('primeRecherche', None),
            'numeroOrdre': validated_data.pop('numeroOrdre', None),
        }
        enseignant = Enseignant.objects.create(**validated_data)
        self._save_diplome(enseignant, diplome_data)
        self._save_titre(enseignant, contract_data)
        return enseignant

    def update(self, instance, validated_data):
        diplome_data = validated_data.pop('diplome', None)
        contract_data = {
            'typeContrat': validated_data.pop('typeContrat', None),
            'dateDebut': validated_data.pop('dateDebut', None),
            'dateFin': validated_data.pop('dateFin', None),
            'dateTitularisation': validated_data.pop('dateTitularisation', None),
            'anneeInscription': validated_data.pop('anneeInscription', None),
            'nbHeures': validated_data.pop('nbHeures', None),
            'tauxHoraire': validated_data.pop('tauxHoraire', None),
            'dureeContrat': validated_data.pop('dureeContrat', None),
            'sujetThese': validated_data.pop('sujetThese', None),
            'universite': validated_data.pop('universite', None),
            'primeRecherche': validated_data.pop('primeRecherche', None),
            'numeroOrdre': validated_data.pop('numeroOrdre', None),
        }
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if diplome_data is not None:
            self._save_diplome(instance, diplome_data)
        if contract_data.get('typeContrat'):
            self._save_titre(instance, contract_data)
        return instance

    def _save_diplome(self, enseignant, diplome_data):
        print("Saving diplome for", enseignant.matricule, "data:", diplome_data)
        if not diplome_data or not diplome_data.get('libelleDiplome') or not diplome_data.get('dateObtention'):
            print("Diplome data incomplete, skipping")
            return

        diplome = Diplome.objects.create(
            libelleDiplome=diplome_data['libelleDiplome'],
            specialite=diplome_data.get('specialite', ''),
            universite=diplome_data.get('universite', ''),
            dateObtention=diplome_data['dateObtention']
        )
        print("Created diplome", diplome.idDiplome)

        EnseignantDiplome.objects.update_or_create(
            matricule=enseignant,
            defaults={
                'idDiplome': diplome,
                'dateObtention': diplome.dateObtention,
            }
        )
        print("Created EnseignantDiplome")

    def _save_titre(self, enseignant, contract_data):
        if not contract_data:
            return

        contrat_type = contract_data.get('typeContrat')
        if not contrat_type:
            return

        current_title = Titre.objects.filter(enseignant=enseignant).first()
        if current_title:
            current_title.delete()

        date_debut = contract_data.get('dateDebut') or getattr(enseignant, 'dateRecrutement', None)
        if contrat_type == 'Permanent':
            Permanent.objects.create(
                enseignant=enseignant,
                dateDebutTitre=date_debut or getattr(enseignant, 'dateRecrutement', None),
                dateTitularisation=contract_data.get('dateTitularisation') or date_debut or getattr(enseignant, 'dateRecrutement', None),
                anneeInscription=contract_data.get('anneeInscription')
            )
        elif contrat_type == 'Vacataire':
            Vacataire.objects.create(
                enseignant=enseignant,
                dateDebutTitre=date_debut or getattr(enseignant, 'dateRecrutement', None),
                nbHeures=contract_data.get('nbHeures') or 0,
                tauxHoraire=contract_data.get('tauxHoraire') or 0.0
            )
        elif contrat_type in ('ContratDoctorant', 'ContratDocteur'):
            contractuel = Contractuel.objects.create(
                enseignant=enseignant,
                dateDebutTitre=date_debut or getattr(enseignant, 'dateRecrutement', None),
                dureeContrat=contract_data.get('dureeContrat') or 0,
                dateDebutContrat=contract_data.get('dateDebut') or date_debut or getattr(enseignant, 'dateRecrutement', None),
                dateFinContrat=contract_data.get('dateFin') or date_debut or getattr(enseignant, 'dateRecrutement', None),
            )
            if contrat_type == 'ContratDoctorant':
                ContratDoctorant.objects.update_or_create(
                    contractuel=contractuel,
                    defaults={
                        'sujetThese': contract_data.get('sujetThese', ''),
                        'universiteInscription': contract_data.get('universite', ''),
                        'anneeInscription': contract_data.get('anneeInscription'),
                    }
                )
            else:
                ContratDocteur.objects.update_or_create(
                    contractuel=contractuel,
                    defaults={
                        'primeRecherche': contract_data.get('primeRecherche') or 0.0,
                        'numeroOrdre': contract_data.get('numeroOrdre'),
                    }
                )

    def get_diplome(self, obj):
        try:
            ed = obj.enseignantdiplome_set.first() if hasattr(obj, 'enseignantdiplome_set') else None
            if ed:
                return DiplomeSerializer(ed.idDiplome).data
            return None
        except Exception as e:
            return None

    def get_typeContrat(self, obj):
        try:
            return get_enseignant_contract_type_label(obj)
        except Exception:
            return None

    def get_dateDebut(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre:
                if hasattr(titre, 'contractuel'):
                    return titre.contractuel.dateDebutContrat
                else:
                    return titre.dateDebutTitre
            return None
        except Exception:
            return None

    def get_dateFin(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre:
                if hasattr(titre, 'contractuel'):
                    return titre.contractuel.dateFinContrat
            return None
        except Exception:
            return None

    def get_dateTitularisation(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'permanent'):
                return titre.permanent.dateTitularisation
            return None
        except Exception:
            return None

    def get_anneeInscription(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre:
                if hasattr(titre, 'permanent'):
                    return titre.permanent.anneeInscription
                elif hasattr(titre, 'contractuel') and hasattr(titre.contractuel, 'contratdoctorant'):
                    return titre.contractuel.contratdoctorant.anneeInscription
            return None
        except Exception:
            return None

    def get_nbHeures(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'vacataire'):
                return titre.vacataire.nbHeures
            return None
        except Exception:
            return None

    def get_tauxHoraire(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'vacataire'):
                return titre.vacataire.tauxHoraire
            return None
        except Exception:
            return None

    def get_dureeContrat(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'contractuel'):
                return titre.contractuel.dureeContrat
            return None
        except Exception:
            return None

    def get_sujetThese(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'contractuel') and hasattr(titre.contractuel, 'contratdoctorant'):
                return titre.contractuel.contratdoctorant.sujetThese
            return None
        except Exception:
            return None

    def get_universite(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'contractuel') and hasattr(titre.contractuel, 'contratdoctorant'):
                return titre.contractuel.contratdoctorant.universiteInscription
            return None
        except Exception:
            return None

    def get_primeRecherche(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'contractuel') and hasattr(titre.contractuel, 'contratdocteur'):
                return titre.contractuel.contratdocteur.primeRecherche
            return None
        except Exception:
            return None

    def get_numeroOrdre(self, obj):
        try:
            titre = obj.titres.first() if hasattr(obj, 'titres') else None
            if titre and hasattr(titre, 'contractuel') and hasattr(titre.contractuel, 'contratdocteur'):
                return titre.contractuel.contratdocteur.numeroOrdre
            return None
        except Exception:
            return None

    def validate_cin(self, value):
        if value:
            import re
            if not re.match(r'^\d{8}$', value):
                raise serializers.ValidationError("Le CIN doit contenir exactement 8 chiffres.")
            queryset = Enseignant.objects.filter(cin=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Ce CIN est déjà utilisé par un autre enseignant.")
        return value

    def validate_email(self, value):
        if value:
            queryset = Enseignant.objects.filter(email=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("Cet email est déjà utilisé par un autre enseignant.")
        return value

    def validate_numtel(self, value):
        if value:
            import re
            # Remove spaces, hyphens, and dots for validation
            cleaned = re.sub(r'[\s\-\.\(\)]+', '', value)
            if not re.match(r'^\d{8,}$', cleaned):
                raise serializers.ValidationError("Le numéro de téléphone doit contenir au moins 8 chiffres.")
            # Return cleaned version
            return cleaned
        return value

    def validate_dateRecrutement(self, value):
        """Validation: la date de recrutement ne doit pas être dans le futur"""
        if value:
            # Convert to date if needed
            if isinstance(value, datetime):
                value_date = value.date()
            else:
                value_date = value
            
            if value_date > date.today():
                raise serializers.ValidationError("La date de recrutement ne peut pas être dans le futur.")
        return value

    def validate_dateTitularisation(self, value):
        """Validation: la date de titularisation ne doit pas être dans le futur"""
        if value:
            # Convert to date if needed
            if isinstance(value, datetime):
                value_date = value.date()
            else:
                value_date = value
            
            if value_date > date.today():
                raise serializers.ValidationError("La date de titularisation ne peut pas être dans le futur.")
        return value

    class Meta:
        model = Enseignant
        fields = [
            'matricule',
            'cin',
            'nom',
            'prenom',
            'email',
            'numtel',
            'grade',
            'dateRecrutement',
            'statutAdministratif',
            'plafond_pfe',
            'plafond_enseignement',
            'diplome',
            'typeContrat',
            'dateDebut',
            'dateFin',
            'dateTitularisation',
            'anneeInscription',
            'nbHeures',
            'tauxHoraire',
            'dureeContrat',
            'sujetThese',
            'universite',
            'primeRecherche',
            'numeroOrdre',
        ]

