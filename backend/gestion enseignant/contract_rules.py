"""Règles métier liées au type de contrat des enseignants (titres / contractuels)."""

from .models import Titre, Permanent, Vacataire, Contractuel, ContratDoctorant, ContratDocteur


def get_enseignant_contract_type_label(enseignant):
    """
    Libellé aligné sur EnseignantSerializer : Permanent, Vacataire, Contractuel,
    ContratDoctorant, ContratDocteur, ou None si aucun titre.
    """
    titre = None
    if hasattr(enseignant, '_prefetched_objects_cache') and 'titres' in enseignant._prefetched_objects_cache:
        titres = enseignant._prefetched_objects_cache['titres']
        titre = titres[0] if len(titres) > 0 else None
    else:
        titres = list(enseignant.titres.all()) if hasattr(enseignant, 'titres') else []
        titre = titres[0] if titres else Titre.objects.filter(enseignant=enseignant).first()

    if not titre:
        return None
        
    try:
        if hasattr(titre, 'permanent'): return 'Permanent'
    except Exception: pass
    
    try:
        if hasattr(titre, 'vacataire'): return 'Vacataire'
    except Exception: pass
    
    try:
        if hasattr(titre, 'contractuel'):
            c = titre.contractuel
            if hasattr(c, 'contratdoctorant'): return 'ContratDoctorant'
            if hasattr(c, 'contratdocteur'): return 'ContratDocteur'
            return 'Contractuel'
    except Exception: pass

    if Permanent.objects.filter(pk=titre.pk).exists():
        return 'Permanent'
    if Vacataire.objects.filter(pk=titre.pk).exists():
        return 'Vacataire'
    c = Contractuel.objects.filter(pk=titre.pk).first()
    if c:
        if ContratDoctorant.objects.filter(contractuel=c).exists():
            return 'ContratDoctorant'
        if ContratDocteur.objects.filter(contractuel=c).exists():
            return 'ContratDocteur'
        return 'Contractuel'
    return None


def is_contrat_doctorant_ou_docteur(enseignant):
    """Contrat doctorant ou contrat docteur : ne peuvent pas être rapporteurs de soutenance."""
    t = get_enseignant_contract_type_label(enseignant)
    return t in ('ContratDoctorant', 'ContratDocteur')


def enseignant_peut_etre_rapporteur(enseignant):
    """Tous les types de contrat sont autorisés sauf ContratDoctorant et ContratDocteur."""
    return not is_contrat_doctorant_ou_docteur(enseignant)
