import os
import openai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from academique.models import Departement, Specialite
from enseignants.models import Enseignant
from etudiants.models import Etudiant
from pfes.models import PFE, Soutenance

from openai import OpenAI

import requests

# On récupère la clé Groq
groq_key = getattr(settings, "GROQ_API_KEY", os.environ.get("GROQ_API_KEY", ""))

# On initialise le client OpenAI mais en pointant sur les serveurs de Groq (compatibilité 100%)
if groq_key:
    client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
else:
    client = None

class AIChatView(APIView):
    def post(self, request):
        user_message = request.data.get("message", "").strip()
        history = request.data.get("history", [])

        if not user_message:
            return Response({"error": "Message is required"}, status=400)

        try:
            # Aggregate stats to give the LLM context of the university state
            stats = {
                "total_etudiants": Etudiant.objects.count(),
                "total_enseignants": Enseignant.objects.count(),
                "total_pfes": PFE.objects.count(),
                "total_soutenances": Soutenance.objects.count(),
                "departements": list(Departement.objects.values_list('nom', flat=True)),
                "specialites": list(Specialite.objects.values_list('nom', flat=True))
            }
            
            # Formater toutes les soutenances
            soutenances_list = Soutenance.objects.all()
            soutenances_str = ""
            for s in soutenances_list:
                pfe_sujet = s.pfe.sujet if s.pfe else 'Aucun PFE lié'
                s_type = getattr(s, 'get_type_soutenance_display', lambda: s.type_soutenance)() if hasattr(s, 'type_soutenance') else 'Finale'
                duree_str = f"{s.duree} min" if s.duree else "Non spécifiée"
                soutenances_str += f"- Type: {s_type}, Salle: {s.salle}, Date: {s.date_soutenance}, Heure: {s.heure_soutenance}, Durée: {duree_str}, Sujet: {pfe_sujet}, Encadrant: {s.encadrant}, Rapporteur: {s.rapporteur}\n"
            if not soutenances_str:
                soutenances_str = "Aucune soutenance enregistrée."
                
            # Formater tous les étudiants
            etudiants_list = Etudiant.objects.all()
            etudiants_str = ""
            for e in etudiants_list:
                etudiants_str += f"- Nom/Prénom: {e.nom} {e.prenom}, Email: {e.email}, Spécialité: {e.specialite}, Situation: {getattr(e, 'situation', 'N/A')}\n"
            if not etudiants_str:
                etudiants_str = "Aucun étudiant."

            # Formater tous les enseignants
            enseignants_list = Enseignant.objects.all()
            enseignants_str = ""
            for e in enseignants_list:
                enseignants_str += f"- Nom/Prénom: {e.nom} {e.prenom}, Grade: {e.grade}, Email: {e.email}\n"
            if not enseignants_str:
                enseignants_str = "Aucun enseignant."
                
            # Formater tous les PFEs
            pfes_list = PFE.objects.all()
            pfes_str = ""
            for p in pfes_list:
                pfes_str += f"- Sujet: {p.sujet}, Spécialité: {p.specialite}, Lieu: {getattr(p, 'lieu_stage', 'N/A')}\n"
            if not pfes_str:
                pfes_str = "Aucun PFE."

            db_context = f"""
            Contexte de la base de données :
            - Départements : {', '.join(stats['departements'])}
            
            Liste complète des étudiants ({stats['total_etudiants']}) :
            {etudiants_str}
            
            Liste complète des enseignants ({stats['total_enseignants']}) :
            {enseignants_str}
            
            Liste complète des PFEs ({stats['total_pfes']}) :
            {pfes_str}
            
            Liste complète des soutenances ({stats['total_soutenances']}) :
            {soutenances_str}
            """

            system_prompt = f"""
            Tu es l'assistant IA intégré au système de gestion académique de la faculté. 
            Ton rôle est de répondre intelligemment aux questions concernant l'application et les données.
            
            {db_context}
            
            Règles strictes :
            - Réponds TOUJOURS en français.
            - Sois précis, amical et concis.
            - Utilise la mise en forme Markdown (listes, gras).
            - **Ne te base QUE sur les données fournies ci-dessus.**
            - **N'invente JAMAIS d'étudiants, de soutenances ou de professeurs qui ne sont pas dans les listes ci-dessus.**
            - Si l'information n'est pas dans le contexte, dis clairement que tu n'as pas accès à cette donnée ou qu'elle n'existe pas dans le système.
            """

            messages = [{"role": "system", "content": system_prompt}]
            
            # Limit history to last 6 elements to prevent huge token usage
            for msg in history[-6:]:
                messages.append({"role": msg.get("role"), "content": msg.get("content")})
                
            messages.append({"role": "user", "content": user_message})

            if not client:
                return Response({
                    "status": "success",
                    "reply": "⚠️ La clé GROQ_API_KEY n'est pas configurée dans settings.py."
                })

            # Appel à l'Intelligence Artificielle LLaMA 3.1 via Groq
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant", # Nouveau modèle LLaMA 3.1
                messages=messages,
                temperature=0.1, # Réduit à 0.1 pour empêcher l'IA d'halluciner ou d'inventer
                max_tokens=600
            )
            ai_reply = response.choices[0].message.content

            return Response({
                "status": "success",
                "reply": ai_reply
            })
            
        except Exception as e:
            error_str = str(e)
            reply = f"❌ **Erreur IA :** {error_str}"
                
            return Response({"status": "success", "reply": reply})
