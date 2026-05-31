# Bibliothèques système
import os

# Configuration Django
from django.conf import settings

# Classes DRF pour créer API
from rest_framework.views import APIView
from rest_framework.response import Response

# Modèles de l'application
from academique.models import Departement, Specialite
from enseignants.models import Enseignant
from etudiants.models import Etudiant
from pfes.models import PFE, Soutenance

# Client OpenAI compatible avec Groq
from openai import OpenAI

# Bibliothèque requêtes HTTP
import requests


# ==========================
# Configuration API Groq
# ==========================

# Récupération de la clé API depuis settings.py
# ou depuis les variables d'environnement
groq_key = getattr(
    settings,
    "GROQ_API_KEY",
    os.environ.get("GROQ_API_KEY", "")
)

# Initialisation du client IA
# Groq utilise l'API OpenAI compatible
if groq_key:
    client = OpenAI(
        api_key=groq_key,
        base_url="https://api.groq.com/openai/v1"
    )
else:
    client = None


# ==========================
# API Chat IA
# ==========================

class AIChatView(APIView):

    # Méthode POST
    def post(self, request):

        # Message envoyé par l'utilisateur
        user_message = request.data.get(
            "message",
            ""
        ).strip()

        # Historique de conversation
        history = request.data.get(
            "history",
            []
        )

        # Vérification message vide
        if not user_message:
            return Response(
                {"error": "Message is required"},
                status=400
            )

        try:

            # ==========================
            # Statistiques générales
            # ==========================

            stats = {

                # Nombre total étudiants
                "total_etudiants":
                Etudiant.objects.count(),

                # Nombre total enseignants
                "total_enseignants":
                Enseignant.objects.count(),

                # Nombre total PFE
                "total_pfes":
                PFE.objects.count(),

                # Nombre total soutenances
                "total_soutenances":
                Soutenance.objects.count(),

                # Liste départements
                "departements":
                list(
                    Departement.objects.values_list(
                        'nom',
                        flat=True
                    )
                ),

                # Liste spécialités
                "specialites":
                list(
                    Specialite.objects.values_list(
                        'nom',
                        flat=True
                    )
                )
            }

            # ==========================
            # Construction liste soutenances
            # ==========================

            soutenances_list = Soutenance.objects.all()

            soutenances_str = ""

            for s in soutenances_list:

                # Sujet PFE associé
                pfe_sujet = (
                    s.pfe.sujet
                    if s.pfe
                    else "Aucun PFE lié"
                )

                # Type soutenance
                s_type = (
                    getattr(
                        s,
                        'get_type_soutenance_display',
                        lambda: s.type_soutenance
                    )()
                    if hasattr(s, 'type_soutenance')
                    else 'Finale'
                )

                # Durée
                duree_str = (
                    f"{s.duree} min"
                    if s.duree
                    else "Non spécifiée"
                )

                # Ajout dans texte
                soutenances_str += (
                    f"- Type: {s_type}, "
                    f"Salle: {s.salle}, "
                    f"Date: {s.date_soutenance}, "
                    f"Heure: {s.heure_soutenance}, "
                    f"Durée: {duree_str}, "
                    f"Sujet: {pfe_sujet}, "
                    f"Encadrant: {s.encadrant}, "
                    f"Rapporteur: {s.rapporteur}\n"
                )

            # Cas aucune soutenance
            if not soutenances_str:
                soutenances_str = (
                    "Aucune soutenance enregistrée."
                )

            # ==========================
            # Construction liste étudiants
            # ==========================

            etudiants_list = Etudiant.objects.all()

            etudiants_str = ""

            for e in etudiants_list:

                # Situation semestre 5
                sit_s5 = (
                    getattr(
                        e,
                        'get_situation_s5_display',
                        lambda: e.situation_s5
                    )()
                    if hasattr(
                        e,
                        'situation_s5'
                    )
                    else 'N/A'
                )

                # Situation PFE
                sit_pfe = (
                    getattr(
                        e,
                        'get_situation_pfe_display',
                        lambda: e.situation_pfe
                    )()
                    if hasattr(
                        e,
                        'situation_pfe'
                    )
                    else 'N/A'
                )

                etudiants_str += (
                    f"- Nom/Prénom: "
                    f"{e.nom_fr} {e.prenom_fr}, "
                    f"Email: {e.email}, "
                    f"Spécialité: {e.specialite}, "
                    f"Situation S5: {sit_s5}, "
                    f"Situation PFE: {sit_pfe}\n"
                )

            if not etudiants_str:
                etudiants_str = "Aucun étudiant."

            # ==========================
            # Construction liste enseignants
            # ==========================

            enseignants_list = Enseignant.objects.all()

            enseignants_str = ""

            for e in enseignants_list:

                enseignants_str += (
                    f"- Nom/Prénom: "
                    f"{e.nom} {e.prenom}, "
                    f"Grade: {e.grade}, "
                    f"Email: {e.email}\n"
                )

            if not enseignants_str:
                enseignants_str = (
                    "Aucun enseignant."
                )

            # ==========================
            # Construction liste PFE
            # ==========================

            pfes_list = PFE.objects.all()

            pfes_str = ""

            for p in pfes_list:

                pfes_str += (
                    f"- Sujet: {p.sujet}, "
                    f"Spécialité: {p.specialite}, "
                    f"Lieu: {getattr(p,'lieu_stage','N/A')}\n"
                )

            if not pfes_str:
                pfes_str = "Aucun PFE."

            # ==========================
            # Contexte envoyé à l'IA
            # ==========================

            db_context = f"""
            Contexte de la base de données :

            Départements :
            {', '.join(stats['departements'])}

            Liste étudiants :
            {etudiants_str}

            Liste enseignants :
            {enseignants_str}

            Liste PFEs :
            {pfes_str}

            Liste soutenances :
            {soutenances_str}
            """

            # ==========================
            # Prompt système
            # ==========================

            system_prompt = f"""
            Tu es l'assistant IA du système académique.

            {db_context}

            Règles :

            - Répondre uniquement en français.
            - Être précis et concis.
            - Utiliser Markdown.
            - Utiliser uniquement les données fournies.
            - Ne jamais inventer d'informations.
            - Si aucune donnée n'existe,
              le dire clairement.
            """

            # ==========================
            # Préparation messages IA
            # ==========================

            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                }
            ]

            # Ajout historique récent
            for msg in history[-6:]:

                messages.append(
                    {
                        "role":
                        msg.get("role"),

                        "content":
                        msg.get("content")
                    }
                )

            # Message utilisateur
            messages.append(
                {
                    "role": "user",
                    "content": user_message
                }
            )

            # Vérification clé API
            if not client:

                return Response(
                    {
                        "status": "success",
                        "reply":
                        "Clé GROQ_API_KEY absente."
                    }
                )

            # ==========================
            # Appel IA LLaMA 3.3
            # ==========================

            response = (
                client.chat.completions.create(

                    model=
                    "llama-3.3-70b-versatile",

                    messages=messages,

                    # Faible température
                    # pour limiter les hallucinations
                    temperature=0.1,

                    max_tokens=600
                )
            )

            # Réponse générée
            ai_reply = (
                response
                .choices[0]
                .message
                .content
            )

            # Retour frontend
            return Response(
                {
                    "status": "success",
                    "reply": ai_reply
                }
            )

        except Exception as e:

            # Gestion des erreurs
            error_str = str(e)

            reply = (
                f"❌ Erreur IA : {error_str}"
            )

            return Response(
                {
                    "status": "success",
                    "reply": reply
                }
            )