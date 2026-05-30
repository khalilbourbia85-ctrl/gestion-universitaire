from rest_framework import serializers

# Importation des modèles
from .models import Departement, Licence, Specialite, Module
from .models import UEElement


# =====================================
# Serializer Département
# =====================================
class DepartementSerializer(serializers.ModelSerializer):
    """
    Transforme les données du modèle Département
    en format JSON et inversement.
    """

    class Meta:
        model = Departement

        # Champs exposés dans l'API
        fields = [
            'id', 'nom', 'code', 'description',
            'responsable', 'email', 'telephone',
            'photo', 'date_creation', 'date_modification'
        ]


# =====================================
# Serializer Licence
# =====================================
class LicenceSerializer(serializers.ModelSerializer):

    # Affichage du nom du département associé
    # sans devoir faire une requête supplémentaire
    departement_nom = serializers.CharField(
        source='departement.nom',
        read_only=True
    )

    class Meta:
        model = Licence

        fields = [
            'id', 'nom', 'domaine', 'mention',
            'parcours', 'description', 'duree',
            'departement', 'departement_nom',
            'date_creation', 'date_modification'
        ]


# =====================================
# Serializer Spécialité
# =====================================
class SpecialiteSerializer(serializers.ModelSerializer):

    # Nom de la licence liée
    licence_nom = serializers.CharField(
        source='licence.nom',
        read_only=True
    )

    # Nom du département lié à la licence
    departement_nom = serializers.CharField(
        source='licence.departement.nom',
        read_only=True
    )

    class Meta:
        model = Specialite

        fields = [
            'id', 'nom', 'code', 'description',
            'licence', 'licence_nom',
            'departement_nom',
            'date_creation', 'date_modification'
        ]


# =====================================
# Serializer Module (UE)
# =====================================
class ModuleSerializer(serializers.ModelSerializer):

    # Informations supplémentaires affichées
    licence_nom = serializers.CharField(
        source='licence.nom',
        read_only=True
    )

    specialite_nom = serializers.CharField(
        source='specialite.nom',
        read_only=True
    )

    departement_nom = serializers.CharField(
        source='licence.departement.nom',
        read_only=True
    )

    class Meta:
        model = Module

        fields = [
            'id', 'nom', 'code',
            'matieres',
            'coefficient_ue',
            'credit_ue',
            'semestre',
            'annee',
            'licence',
            'licence_nom',
            'specialite',
            'specialite_nom',
            'departement_nom',
            'description',
            'date_creation',
            'date_modification'
        ]


# =====================================
# Serializer Élément UE (ECUE)
# =====================================
class UEElementSerializer(serializers.ModelSerializer):

    # Informations calculées et affichées
    module_nom = serializers.CharField(
        source='module.nom',
        read_only=True
    )

    specialite_nom = serializers.CharField(
        source='module.specialite.nom',
        read_only=True
    )

    licence_nom = serializers.CharField(
        source='module.licence.nom',
        read_only=True
    )

    enseignant_nom = serializers.CharField(
        source='enseignant.nom',
        read_only=True
    )

    # Champ calculé dynamiquement
    heures_estimees = serializers.SerializerMethodField()

    # Liste des affectations liées à cet élément
    affectations_details = serializers.SerializerMethodField()

    class Meta:
        model = UEElement

        fields = [
            'id',
            'module',
            'module_nom',
            'specialite_nom',
            'licence_nom',
            'nom',
            'code',
            'coefficient',
            'credit',
            'vh_c',
            'vh_td',
            'vh_tp',
            'vh_ci',
            'sections',
            'groupes_td',
            'sous_groupes_tp',
            'etudiants',
            'enseignant',
            'enseignant_nom',
            'heures_estimees',
            'affectations_details',
            'date_creation',
            'date_modification'
        ]

    # ==========================
    # Retourne les détails
    # d'affectation associés
    # ==========================
    def get_affectations_details(self, obj):
        return AffectationDetailSerializer(
            obj.affectations_details.all(),
            many=True
        ).data

    # ==========================
    # Calcule le volume horaire
    # total de l'élément UE
    # ==========================
    def get_heures_estimees(self, obj):
        try:
            return float(obj.total_heures())
        except Exception:
            return 0.0

    # ==========================
    # Validation métier
    # ==========================
    def validate(self, attrs):

        # Récupération de l'enseignant
        enseignant = attrs.get(
            'enseignant',
            getattr(self.instance, 'enseignant', None)
        )

        if enseignant is None:
            return attrs

        # Récupération des volumes horaires
        vh_c = attrs.get('vh_c', getattr(self.instance, 'vh_c', 0)) or 0
        vh_td = attrs.get('vh_td', getattr(self.instance, 'vh_td', 0)) or 0
        vh_tp = attrs.get('vh_tp', getattr(self.instance, 'vh_tp', 0)) or 0
        vh_ci = attrs.get('vh_ci', getattr(self.instance, 'vh_ci', 0)) or 0

        sections = attrs.get(
            'sections',
            getattr(self.instance, 'sections', 1)
        ) or 1

        groupes_td = attrs.get(
            'groupes_td',
            getattr(self.instance, 'groupes_td', 1)
        ) or 1

        sous_groupes_tp = attrs.get(
            'sous_groupes_tp',
            getattr(self.instance, 'sous_groupes_tp', 1)
        ) or 1

        # Calcul du nombre d'heures de la nouvelle affectation
        total_hours = (
            vh_c * sections
            + vh_td * groupes_td
            + vh_tp * sous_groupes_tp
            + vh_ci * sections
        )

        # Récupération des affectations existantes
        existing = UEElement.objects.filter(
            enseignant=enseignant
        )

        # Exclure l'objet actuel lors d'une modification
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)

        # Somme des heures déjà attribuées
        current_hours = sum(
            [float(item.total_heures()) for item in existing]
        )

        # Récupération du plafond autorisé
        plafond = getattr(
            enseignant,
            'plafond_enseignement',
            None
        )

        # Cas particulier des vacataires
        if plafond is None:

            titre = (
                enseignant.titres.first()
                if hasattr(enseignant, 'titres')
                else None
            )

            if (
                titre
                and hasattr(titre, 'vacataire')
                and titre.vacataire
            ):
                plafond = titre.vacataire.nbHeures

        # Vérification du dépassement du plafond
        if plafond and (
            current_hours + total_hours
        ) > float(plafond):

            raise serializers.ValidationError({
                'enseignant':
                f"L'enseignant dépasse son plafond "
                f"d'heures ({plafond}) avec cette affectation."
            })

        # Mise à jour automatique de la licence
        # à partir de la spécialité
        specialite = attrs.get(
            'specialite'
        ) or getattr(
            self.instance,
            'specialite',
            None
        )

        licence = attrs.get(
            'licence'
        ) or getattr(
            self.instance,
            'licence',
            None
        )

        if specialite and not licence:
            attrs['licence'] = specialite.licence

        return attrs


# Import du modèle AffectationDetail
from .models import AffectationDetail


# =====================================
# Serializer Affectation Detail
# =====================================
class AffectationDetailSerializer(serializers.ModelSerializer):

    # Informations supplémentaires sur l'enseignant
    enseignant_nom = serializers.CharField(
        source='enseignant.nom',
        read_only=True
    )

    enseignant_prenom = serializers.CharField(
        source='enseignant.prenom',
        read_only=True
    )

    class Meta:
        model = AffectationDetail

        fields = [
            'id',
            'ue_element',
            'enseignant',
            'enseignant_nom',
            'enseignant_prenom',
            'type_cours',
            'groupe',
            'date_creation'
        ]