import re
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
import openpyxl
from io import BytesIO
import logging

from enseignants.models import Enseignant, Permanent, Vacataire
from enseignants.contract_rules import get_enseignant_contract_type_label
from etudiants.models import Etudiant
from .charge_balance import count_pfe_encadrant, count_soutenance_rapporteur
from .models import ParametresPfe, Rapporteur, PFE, Soutenance, Salle
from .serializers import RapporteurSerializer, PFESerializer, SoutenanceSerializer, SalleSerializer
from utils.excel_utils import read_excel_file, read_csv_file, normalize_header

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer


def send_pfe_assignment_email(pfe, encadrant):
    etudiants = pfe.etudiants.all()
    liste_etudiants = ", ".join([f"{etu.nom_fr} {etu.prenom_fr}" for etu in etudiants]) if etudiants else "Aucun"
    
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
        """Import rapporteurs from Excel or CSV file"""
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Detect file type
            filename = file.name.lower()
            if filename.endswith('.csv'):
                headers, rows, file_errors = read_csv_file(file)
            else:
                headers, rows, file_errors = read_excel_file(file)
            
            if file_errors:
                return Response({'errors': file_errors}, status=status.HTTP_400_BAD_REQUEST)
            
            created = []
            errors = []
            
            with transaction.atomic():
                for row_idx, row_data in rows:
                    try:
                        matricule = row_data.get('matricule', '').strip() or row_data.get('matricul', '').strip()
                        
                        if not matricule:
                            errors.append(f"Ligne {row_idx}: Matricule manquant")
                            continue
                        
                        # Try to find the teacher
                        enseignant = find_enseignant(matricule)
                        if not enseignant:
                            errors.append(f"Ligne {row_idx}: Enseignant '{matricule}' non trouvé")
                            continue
                        
                        obj, created_flag = Rapporteur.objects.update_or_create(
                            matricule=matricule,
                            defaults={
                                'cin': enseignant.cin,
                                'nom': enseignant.nom,
                                'prenom': enseignant.prenom,
                                'email': enseignant.email,
                                'numtel': enseignant.numtel,
                            }
                        )
                        created.append({'matricule': obj.matricule, 'nom': obj.nom, 'created': created_flag})
                    except Exception as e:
                        errors.append(f"Ligne {row_idx}: {str(e)}")
            
            return Response({
                'created': created,
                'errors': errors,
                'message': f'{len(created)} rapporteur(s) importé(s) avec succès.'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'detail': f'Erreur: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class PFEViewSet(viewsets.ModelViewSet):
    serializer_class = PFESerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        # Retourner tous les PFE pour les opérations de création
        # Les filtres sont appliqués dans list() seulement
        return PFE.objects.all()

    def list(self, request, *args, **kwargs):
        # Ici on applique les filtres de permissions
        queryset = self.get_queryset()
        user = request.user
        
        if not getattr(user, 'is_superuser', False):
            enseignant = getattr(user, 'enseignant', None)
            if not enseignant:
                queryset = PFE.objects.none()
            else:
                role = getattr(enseignant, 'role', '')
                departement = getattr(enseignant, 'departement', None)

                if role == 'chef_departement' and departement:
                    queryset = queryset.filter(
                        Q(encadrant__departement=departement) |
                        Q(etudiants__licence__departement=departement) |
                        Q(etudiants__specialite__licence__departement=departement) |
                        Q(encadrant__departement__isnull=True) |
                        Q(etudiants__licence__isnull=True)
                    ).distinct()
                else:
                    # Un enseignant simple ne voit que les PFE qu'il encadre
                    queryset = queryset.filter(encadrant=enseignant).distinct()
        
        # Utiliser la méthode list() standard avec le queryset filtré
        self.queryset = queryset
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info(f"Création PFE - Données reçues: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Erreurs de validation: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Erreur lors de la création PFE: {e}", exc_info=True)
            raise

    def update(self, request, *args, **kwargs):
        logger.info(f"Mise à jour PFE {kwargs.get('pk')} - Données reçues: {request.data}")
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if not serializer.is_valid():
                logger.error(f"Erreurs de validation: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_update(serializer)
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour PFE: {e}", exc_info=True)
            raise

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
        """
        Import PFE data from an Excel or CSV file.
        Expected columns: sujet, duree, specialite, type_projet, encadrant_matricule, etudiant1_num, etudiant2_num
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Detect file type and read
            filename = file.name.lower()
            if filename.endswith('.csv'):
                headers, rows, file_errors = read_csv_file(file)
            else:
                headers, rows, file_errors = read_excel_file(file)
            
            if file_errors:
                return Response({'errors': file_errors}, status=status.HTTP_400_BAD_REQUEST)
            
            created = []
            errors = []
            
            with transaction.atomic():
                for row_idx, row_data in rows:
                    try:
                        # Extract data
                        sujet = row_data.get('sujet', '').strip()
                        duree = row_data.get('duree')
                        specialite = row_data.get('specialite', '').strip()
                        type_projet = row_data.get('typeprojt', '').strip() or row_data.get('typeprojet', '').strip()
                        encadrant_matricule = row_data.get('encadrantmatricule') or row_data.get('encadrant')
                        
                        if not sujet:
                            errors.append(f"Ligne {row_idx}: Sujet manquant")
                            continue
                        
                        if not duree:
                            errors.append(f"Ligne {row_idx}: Durée manquante")
                            continue
                        
                        try:
                            duree = int(float(str(duree)))
                        except (ValueError, TypeError):
                            errors.append(f"Ligne {row_idx}: Durée invalide ({duree})")
                            continue
                        
                        # Find encadrant if provided
                        encadrant = None
                        if encadrant_matricule:
                            encadrant = find_enseignant(str(encadrant_matricule).strip())
                            if not encadrant:
                                errors.append(f"Ligne {row_idx}: Encadrant '{encadrant_matricule}' non trouvé")
                        
                        # Create PFE
                        pfe = PFE.objects.create(
                            sujet=sujet,
                            duree=duree,
                            specialite=specialite,
                            type_projet=type_projet,
                            encadrant=encadrant
                        )
                        
                        # Link students if provided
                        etudiant_fields = [k for k in row_data.keys() if 'etudiant' in k and 'num' in k]
                        for field in sorted(etudiant_fields):
                            num_etudiant = row_data.get(field, '').strip()
                            if num_etudiant:
                                try:
                                    # Handle Excel numbers imported as float (e.g. "12345678.0" -> "12345678")
                                    num_etudiant_str = str(num_etudiant).split('.')[0].strip()
                                    etudiant = find_etudiant(num_etudiant_str)
                                    if etudiant:
                                        pfe.etudiants.add(etudiant)
                                    else:
                                        errors.append(f"Ligne {row_idx}: Étudiant '{num_etudiant}' non trouvé")
                                except Exception as ex:
                                    errors.append(f"Ligne {row_idx}: Erreur lors de la liaison de l'étudiant '{num_etudiant}': {str(ex)}")
                        
                        created.append(pfe.idPfe)
                        
                        # Send email if encadrant assigned
                        if encadrant:
                            send_pfe_assignment_email(pfe, encadrant)
                    
                    except Exception as e:
                        errors.append(f"Ligne {row_idx}: {str(e)}")
                        continue
            
            return Response({
                'created': created,
                'errors': errors,
                'message': f'{len(created)} PFE(s) importés avec succès.'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'detail': f'Erreur lors de la lecture du fichier: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)




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

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            from etudiants.models import Etudiant
            from pfes.models import PFE, Soutenance
            from django.db.models import Count, Q, F, Exists, OuterRef

            total_etudiants = Etudiant.objects.count()
            
            # Pourcentage de dépôt (Dépôt électronique ou papier = True)
            # Get distinct students who have made a deposit
            etudiants_ayant_depose = Etudiant.objects.filter(
                soutenances__depot_electronique=True
            ) | Etudiant.objects.filter(
                soutenances__depot_papier=True
            )
            etudiants_ayant_depose = etudiants_ayant_depose.distinct().count()
            
            pourcentage_depot = (etudiants_ayant_depose / total_etudiants * 100) if total_etudiants > 0 else 0

            # Taux de réussite technique
            soutenance_validees = Soutenance.objects.filter(resultat_technique__icontains='Validé').count()
            soutenance_non_validees = Soutenance.objects.filter(resultat_technique__icontains='Non validé').count()
            total_techniques = soutenance_validees + soutenance_non_validees
            taux_reussite_technique = (soutenance_validees / total_techniques * 100) if total_techniques > 0 else 0

            # Taux de réussite finale
            soutenance_finale_validees = Soutenance.objects.filter(resultat_finale__icontains='Validé').count()
            soutenance_finale_non_validees = Soutenance.objects.filter(resultat_finale__icontains='Non validé').count()
            total_finales = soutenance_finale_validees + soutenance_finale_non_validees
            taux_reussite_finale = (soutenance_finale_validees / total_finales * 100) if total_finales > 0 else 0

            # Nombre d'étudiants par lieu de stage
            # Count distinct students per lieu_stage directly without intermediate annotation
            lieux_stage = list(PFE.objects.exclude(lieu_stage__isnull=True).exclude(lieu_stage='').values('lieu_stage').annotate(
                count=Count('etudiants', distinct=True)
            ).order_by('-count')[:10])

            # Monôme vs Binôme
            # Use distinct count to properly count unique PFEs with 1 or 2 students
            pfes_with_counts = PFE.objects.annotate(nb_etudiants=Count('etudiants', distinct=True))
            monomes = pfes_with_counts.filter(nb_etudiants=1).count()
            binomes = pfes_with_counts.filter(nb_etudiants=2).count()
            total_projets = monomes + binomes
            pct_monome = (monomes / total_projets * 100) if total_projets > 0 else 0
            pct_binome = (binomes / total_projets * 100) if total_projets > 0 else 0

            # Comparaison de réussite par genre
            # Get distinct students from successful defenses
            etudiants_valides = Etudiant.objects.filter(
                soutenances__resultat_technique__icontains='Validé'
            ).distinct()
            etudiants_total_soutenus = Etudiant.objects.filter(
                soutenances__resultat_technique__isnull=False
            ).exclude(soutenances__resultat_technique='').distinct()

            hommes_valides = etudiants_valides.filter(genre='M').count()
            femmes_valides = etudiants_valides.filter(genre='F').count()
            hommes_total = etudiants_total_soutenus.filter(genre='M').count()
            femmes_total = etudiants_total_soutenus.filter(genre='F').count()

            taux_reussite_hommes = (hommes_valides / hommes_total * 100) if hommes_total > 0 else 0
            taux_reussite_femmes = (femmes_valides / femmes_total * 100) if femmes_total > 0 else 0

            # Réussite par département
            from academique.models import Departement
            deps = Departement.objects.all()
            dep_stats = []
            for dep in deps:
                total_dep = etudiants_total_soutenus.filter(licence__departement=dep).count()
                valides_dep = etudiants_valides.filter(licence__departement=dep).count()
                taux = (valides_dep / total_dep * 100) if total_dep > 0 else 0
                if total_dep > 0:
                    dep_stats.append({
                        'departement': dep.nom,
                        'taux_reussite': taux,
                        'total': total_dep
                    })
            
            dep_stats = sorted(dep_stats, key=lambda x: x['taux_reussite'], reverse=True)

            
            return Response({
                'total_etudiants': total_etudiants,
                'etudiants_ayant_depose': etudiants_ayant_depose,
                'pourcentage_depot': pourcentage_depot,
                'taux_reussite_technique': taux_reussite_technique,
                'taux_reussite_finale': taux_reussite_finale,
                'soutenances_validees': soutenance_validees,
                'soutenances_non_validees': soutenance_non_validees,
                'soutenances_finale_validees': soutenance_finale_validees,
                'soutenances_finale_non_validees': soutenance_finale_non_validees,
                'lieux_stage': lieux_stage,
                'pct_monome': pct_monome,
                'pct_binome': pct_binome,
                'taux_reussite_hommes': taux_reussite_hommes,
                'taux_reussite_femmes': taux_reussite_femmes,
                'stats_departements': dep_stats
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in DashboardStatsView: {str(e)}", exc_info=True)
            return Response({
                'error': 'Erreur lors du chargement des statistiques',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

