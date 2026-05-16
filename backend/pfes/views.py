import re
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# import openpyxl

from enseignants.models import Enseignant, Permanent, Vacataire
from enseignants.contract_rules import get_enseignant_contract_type_label
from etudiants.models import Etudiant
from .charge_balance import count_pfe_encadrant, count_soutenance_rapporteur
from .models import ParametresPfe, Rapporteur, PFE, Soutenance, Salle
from .serializers import RapporteurSerializer, PFESerializer, SoutenanceSerializer, SalleSerializer


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer


def normalize_header(value):
    if value is None:
        return ''
    header = str(value).strip().lower()
    header = re.sub(r'[\s_\-]+', '', header)
    header = re.sub(r'[^a-z0-9]', '', header)
    return header

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

def send_pfe_assignment_email(pfe, encadrant):
    etudiants = pfe.etudiants.all()
    liste_etudiants = ", ".join([f"{etu.nom} {etu.prenom}" for etu in etudiants]) if etudiants else "Aucun"
    
    sujet = f"Nouvelle affectation de PFE : {pfe.sujet}"
    message = (
        f"Bonjour {encadrant.nom} {encadrant.prenom},\n\n"
        f"Vous avez été assigné en tant qu’encadrant pour le PFE suivant :\n\n"
        f"Sujet : {pfe.sujet}\n"
        f"Étudiants : {liste_etudiants}\n\n"
        f"Cordialement,\n"
        f"L’administrateur"
    )
    msg_encadrant = EmailMultiAlternatives(
        subject=sujet,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[encadrant.email],
        reply_to=[settings.DEFAULT_FROM_EMAIL]
    )
    html_encadrant = f"<p>Bonjour {encadrant.nom} {encadrant.prenom},</p><p>Vous avez été assigné en tant qu’encadrant pour le PFE suivant :</p><p><strong>Sujet :</strong> {pfe.sujet}<br><strong>Étudiants :</strong> {liste_etudiants}</p><p>Cordialement,<br>L’administrateur</p>"
    msg_encadrant.attach_alternative(html_encadrant, "text/html")
    msg_encadrant.send(fail_silently=True)
    etudiants = pfe.etudiants.all()
    if etudiants:
        sujet_etu = "Affectation de votre encadrant de PFE"
        message_etu = f"Bonjour,\n\nVotre PFE ({pfe.sujet}) a été assigné à l'encadrant {encadrant.nom} {encadrant.prenom} ({encadrant.email}).\n\nCordialement,\nLe Département"
        dest_etu = [etu.email for etu in etudiants if etu.email]
        if dest_etu:
            msg_etu = EmailMultiAlternatives(
                subject=sujet_etu,
                body=message_etu,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=dest_etu,
                reply_to=[settings.DEFAULT_FROM_EMAIL]
            )
            html_etu = f"<p>Bonjour,</p><p>Votre PFE (<strong>{pfe.sujet}</strong>) a été assigné à l'encadrant <strong>{encadrant.nom} {encadrant.prenom}</strong> ({encadrant.email}).</p><p>Cordialement,<br>Le Département</p>"
            msg_etu.attach_alternative(html_etu, "text/html")
            msg_etu.send(fail_silently=True)

def send_soutenance_email(soutenance, is_update=False):
    prefix = "Mise à jour : " if is_update else ""
    sujet = f"{prefix}Programmation de votre soutenance"
    
    date_s = soutenance.date_soutenance.strftime("%d/%m/%Y") if soutenance.date_soutenance else "Non définie"
    heure_s = soutenance.heure_soutenance.strftime("%H:%M") if soutenance.heure_soutenance else "Non définie"
    salle = soutenance.salle or "Non définie"
    enc = f"{soutenance.encadrant.nom} {soutenance.encadrant.prenom}" if soutenance.encadrant else "Non défini"
    rap = f"{soutenance.rapporteur.nom} {soutenance.rapporteur.prenom}" if soutenance.rapporteur else "Non défini"
    
    message = (
        f"Bonjour,\n\n"
        f"Une soutenance vous concernant a été programmée ou mise à jour.\n"
        f"Date : {date_s}\n"
        f"Heure : {heure_s}\n"
        f"Salle : {salle}\n"
        f"Encadrant : {enc}\n"
        f"Rapporteur : {rap}\n\n"
        f"Cordialement,\nLe Département"
    )
    
    destinataires = []
    if soutenance.encadrant and soutenance.encadrant.email:
        destinataires.append(soutenance.encadrant.email)
    if soutenance.rapporteur and soutenance.rapporteur.email:
        destinataires.append(soutenance.rapporteur.email)
        
    for etu in soutenance.etudiants.all():
        if etu.email:
            destinataires.append(etu.email)
            
    if destinataires:
        msg = EmailMultiAlternatives(
            subject=sujet,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=list(set(destinataires)),
            reply_to=[settings.DEFAULT_FROM_EMAIL]
        )
        html_message = (
            f"<p>Bonjour,</p>"
            f"<p>Une soutenance vous concernant a été programmée ou mise à jour.</p>"
            f"<ul>"
            f"<li><strong>Date :</strong> {date_s}</li>"
            f"<li><strong>Heure :</strong> {heure_s}</li>"
            f"<li><strong>Salle :</strong> {salle}</li>"
            f"<li><strong>Encadrant :</strong> {enc}</li>"
            f"<li><strong>Rapporteur :</strong> {rap}</li>"
            f"</ul>"
            f"<p>Cordialement,<br>Le Département</p>"
        )
        msg.attach_alternative(html_message, "text/html")
        msg.send(fail_silently=True)



# def parse_excel_rows(uploaded_file):
#     workbook = openpyxl.load_workbook(uploaded_file, data_only=True)
#     sheet = workbook.active
#     rows = list(sheet.iter_rows(values_only=True))
#     if not rows:
#         return [], ['Le fichier Excel est vide.']
# 
#     headers = [normalize_header(cell) for cell in rows[0]]
#     parsed = []
# 
#     for row_index, row in enumerate(rows[1:], start=2):
#         if not any(row):
#             continue
#         entry = {}
#         for header, cell in zip(headers, row):
#             if cell is None:
#                 continue
#             entry[header] = str(cell).strip()
#         parsed.append((row_index, entry))
# 
#     return parsed, []


def find_enseignant(identifier):
    if identifier is None:
        return None
    identifier = str(identifier).strip()
    return Enseignant.objects.filter(
        Q(matricule=identifier) | Q(cin=identifier) | Q(email__iexact=identifier)
    ).first()


def find_etudiant(identifier):
    if identifier is None:
        return None
    identifier = str(identifier).strip()
    if identifier.isdigit():
        record = Etudiant.objects.filter(idEtudiant=int(identifier)).first()
        if record:
            return record
    return Etudiant.objects.filter(
        Q(cin=identifier) | Q(email__iexact=identifier)
    ).first()


def find_rapporteur(identifier):
    if identifier is None:
        return None
    identifier = str(identifier).strip()
    return Rapporteur.objects.filter(
        Q(matricule=identifier) | Q(cin=identifier) | Q(email__iexact=identifier)
    ).first()


class RapporteurViewSet(viewsets.ModelViewSet):
    queryset = Rapporteur.objects.all()
    serializer_class = RapporteurSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        """
        Liste les fiches rapporteur dédiées ; ajoute aussi les enseignants au contrat
        Permanent ou Vacataire (encadrants éligibles) qui n'ont pas encore de ligne Rapporteur.
        """
        rows = list(Rapporteur.objects.all())
        rapporteur_matricules = {r.matricule for r in rows}
        
        # Load all eligible enseignants with prefetch
        ens_queryset = Enseignant.objects.prefetch_related(
            'titres__permanent', 'titres__vacataire', 
            'titres__contractuel__contratdocteur', 'titres__contractuel__contratdoctorant'
        )
        ens_for_rp = {
            e.matricule: e
            for e in ens_queryset.filter(matricule__in=rapporteur_matricules)
        }

        # FK : utiliser 'enseignant' (plus fiable que '_id' avec héritage Titre/Permanent)
        perm_ids = set(Permanent.objects.values_list('enseignant', flat=True))
        vac_ids = set(Vacataire.objects.values_list('enseignant', flat=True))
        eligibles = (perm_ids | vac_ids) - rapporteur_matricules

        extra_enseignants = (
            ens_queryset.filter(matricule__in=eligibles)
            if eligibles
            else Enseignant.objects.none()
        )

        from django.db.models import Count
        pfe_counts = dict(PFE.objects.values('encadrant_id').annotate(c=Count('idPfe')).values_list('encadrant_id', 'c'))
        soutenance_counts = dict(Soutenance.objects.values('rapporteur_id').annotate(c=Count('idSoutenance')).values_list('rapporteur_id', 'c'))

        data = []
        for r in rows:
            d = RapporteurSerializer(r).data
            ens = ens_for_rp.get(r.matricule) or ens_queryset.filter(
                matricule=r.matricule
            ).first()
            d['syncedFromEnseignant'] = False
            d['typeContrat'] = get_enseignant_contract_type_label(ens) if ens else None
            d['nbGroupesEncadres'] = pfe_counts.get(ens.pk if ens else None, 0)
            d['nbGroupesRapporteur'] = soutenance_counts.get(ens.pk if ens else None, 0)
            data.append(d)

        for ens in extra_enseignants:
            t = get_enseignant_contract_type_label(ens)
            if t not in ('Permanent', 'Vacataire'):
                continue
            d = {
                'matricule': ens.matricule,
                'cin': ens.cin,
                'nom': ens.nom,
                'prenom': ens.prenom,
                'email': ens.email,
                'numtel': ens.numtel,
                'grade': ens.grade,
                'dateRecrutement': ens.dateRecrutement.isoformat() if ens.dateRecrutement else None,
                'statutAdministratif': ens.statutAdministratif,
                'syncedFromEnseignant': True,
                'typeContrat': t,
                'nbGroupesEncadres': pfe_counts.get(ens.pk, 0),
                'nbGroupesRapporteur': soutenance_counts.get(ens.pk, 0),
            }
            data.append(d)

        data.sort(key=lambda x: (x.get('nom') or '', x.get('prenom') or '', x.get('matricule') or ''))
        return Response(data)

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)



class PFEViewSet(viewsets.ModelViewSet):
    serializer_class = PFESerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        pfe = serializer.save()
        if pfe.encadrant:
            send_pfe_assignment_email(pfe, pfe.encadrant)

    def perform_update(self, serializer):
        old_pfe = self.get_object()
        old_encadrant = old_pfe.encadrant
        pfe = serializer.save()
        if pfe.encadrant and pfe.encadrant != old_encadrant:
            send_pfe_assignment_email(pfe, pfe.encadrant)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return PFE.objects.all()
        
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return PFE.objects.none()
            
        role = getattr(enseignant, 'role', '')
        departement = getattr(enseignant, 'departement', None)

        qs = PFE.objects.prefetch_related('etudiants').select_related('encadrant')

        if role == 'admin':
            return qs.all()
        elif role == 'chef_departement' and departement:
            return qs.filter(
                Q(encadrant__departement=departement) |
                Q(etudiants__licence__departement=departement) |
                Q(etudiants__specialite__licence__departement=departement) |
                Q(encadrant__departement__isnull=True) |
                Q(etudiants__licence__isnull=True)
            ).distinct()
        
        # Un enseignant simple ne voit que les PFE qu'il encadre
        return qs.filter(encadrant=enseignant).distinct()

    @action(detail=False, methods=['get', 'patch'], url_path='parametres')
    def parametres(self, request):
        """
        Plafond global de groupes PFE (identique pour tous les encadrants / rapporteurs).
        """
        obj, _ = ParametresPfe.objects.get_or_create(pk=1, defaults={'plafond_groupes': 5})
        if request.method == 'GET':
            return Response({'plafond_groupes': obj.plafond_groupes})
        raw = request.data.get('plafond_groupes')
        try:
            v = int(raw)
        except (TypeError, ValueError):
            return Response(
                {'plafond_groupes': 'Valeur entière entre 1 et 99 requise.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        v = max(1, min(99, v))
        obj.plafond_groupes = v
        obj.save(update_fields=['plafond_groupes'])
        return Response({'plafond_groupes': obj.plafond_groupes})

    @action(detail=False, methods=['post'], url_path='import-excel')
    def import_excel(self, request):
        return Response({'detail': 'Fonction d\'import Excel non disponible.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SoutenanceViewSet(viewsets.ModelViewSet):
    serializer_class = SoutenanceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        soutenance = serializer.save()
        send_soutenance_email(soutenance)

    def perform_update(self, serializer):
        soutenance = serializer.save()
        send_soutenance_email(soutenance, is_update=True)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return Soutenance.objects.all()
        
        enseignant = getattr(user, 'enseignant', None)
        if not enseignant:
            return Soutenance.objects.none()
            
        role = getattr(enseignant, 'role', '')
        departement = getattr(enseignant, 'departement', None)

        qs = Soutenance.objects.prefetch_related('etudiants', 'pfe__etudiants').select_related('encadrant', 'rapporteur', 'pfe', 'pfe__encadrant')

        if role == 'admin':
            return qs.all()
        elif role == 'chef_departement' and departement:
            # Voit les soutenances où l'encadrant OU le rapporteur OU l'étudiant est de son département
            return qs.filter(
                Q(encadrant__departement=departement) | 
                Q(rapporteur__departement=departement) |
                Q(etudiants__licence__departement=departement) |
                Q(etudiants__specialite__licence__departement=departement) |
                Q(encadrant__departement__isnull=True) |
                Q(etudiants__licence__isnull=True)
            ).distinct()
        
        # Un enseignant simple ne voit que les soutenances où il est encadrant ou rapporteur
        return qs.filter(
            Q(encadrant=enseignant) | Q(rapporteur=enseignant)
        ).distinct()
