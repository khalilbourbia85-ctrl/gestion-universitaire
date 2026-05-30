# 🎓 Gestion Départements - UniManage

> Plateforme de gestion académique complète avec architecture professionnelle

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Version](https://img.shields.io/badge/version-2.0-blue)
![Architecture](https://img.shields.io/badge/architecture-modular-success)

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Démarrage](#démarrage)
- [Documentation](#documentation)
- [Contributeurs](#contributeurs)

---

## 👀 Vue d'ensemble

**Gestion Départements** est une plateforme web complète pour gérer les opérations académiques d'une institution d'enseignement supérieur, incluant:

- 👥 Gestion des étudiants
- 👨‍🏫 Gestion des enseignants
- 📚 Gestion des modules et licences
- 🏢 Gestion des départements
- 📋 Gestion des projets finaux (PFEs)
- 🎤 Gestion des soutenances
- 📊 Dashboards statistiques

---

## ✨ Fonctionnalités

### Authentification & Sécurité
- ✅ Authentification par token
- ✅ Gestion des rôles (Admin, Enseignant, Chef Département)
- ✅ Sessions sécurisées
- ✅ Chiffrement des données sensibles

### Gestion Académique
- ✅ CRUD complet pour tous les entités
- ✅ Import/Export de données (Excel)
- ✅ Recherche et filtrage avancés
- ✅ Gestion des années académiques

### Gestion des Projets
- ✅ Affectation des PFEs
- ✅ Gestion des encadrants et rapporteurs
- ✅ Planification des soutenances
- ✅ Jury management
- ✅ Salles de soutenance

### Dashboards
- ✅ Statistiques en temps réel
- ✅ Graphiques de performance
- ✅ Indicateurs KPI
- ✅ Export de rapports

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ avec Vite
- React Router v6
- Axios pour les appels API
- CSS3 et design responsive

**Backend:**
- Django 5.2
- Django REST Framework
- PostgreSQL/SQLite
- Token-based authentication

### Structure

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Pages → Components → Services → API          │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│                Backend (Django)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Routes → ViewSets → Services → Models        │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ SQL
                     ▼
              ┌──────────────┐
              │   Database   │
              └──────────────┘
```

**Pour plus de détails:**
- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) - Vue complète
- 📖 [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Guide de migration
- 📖 [frontend/README_ARCHITECTURE.md](frontend/README_ARCHITECTURE.md) - Détails frontend
- 📖 [backend/README_ARCHITECTURE.md](backend/README_ARCHITECTURE.md) - Détails backend

---

## 💻 Installation

### Prérequis

- Node.js 16+ et npm
- Python 3.9+
- pip
- SQLite ou PostgreSQL

### 1. Cloner le projet

```bash
git clone <repo-url>
cd gestion_departements
```

### 2. Installation Frontend

```bash
cd frontend
npm install
```

### 3. Installation Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configuration Backend

```bash
cd backend
cp .env.example .env  # Copier et configurer si nécessaire
python manage.py migrate
python manage.py createsuperuser  # Créer un admin
```

---

## 🚀 Démarrage

### Mode développement

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python manage.py runserver 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Accédez à: `http://localhost:5173`

### Mode production

**Backend:**
```bash
gunicorn gestion_departements.wsgi --bind 0.0.0.0:8000
```

**Frontend:**
```bash
npm run build
# Servir le contenu de dist/ avec un serveur HTTP
```

---

## 📚 Documentation

### Guides complets

| Document | Description |
|----------|------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture générale du projet |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Guide de migration v1→v2 |
| [frontend/README_ARCHITECTURE.md](frontend/README_ARCHITECTURE.md) | Guide frontend détaillé |
| [backend/README_ARCHITECTURE.md](backend/README_ARCHITECTURE.md) | Guide backend détaillé |

### Démarrer une nouvelle fonctionnalité

Consultez [ARCHITECTURE.md - Exemple d'ajout de fonctionnalité](ARCHITECTURE.md#exemple-dajout-de-nouvelle-fonctionnalité)

### API

API Documentation disponible via Swagger:
```
http://localhost:8000/api/schema/swagger/
```

---

## 🔐 Credentials par défaut

**Frontend:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **IMPORTANT:** Changer les credentials par défaut en production!

---

## 🧪 Tests

### Frontend

```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend

```bash
cd backend
python manage.py test
coverage run --source='.' manage.py test
coverage report
```

---

## 📁 Structure complète

```
gestion_departements/
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── pages/            # Pages principales
│   │   ├── services/         # Services API
│   │   ├── routes/           # Configuration routes
│   │   ├── styles/           # Styles CSS
│   │   ├── layouts/          # Layout wrappers
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # Context API
│   │   ├── constants/        # Constants
│   │   ├── assets/           # Images/icons
│   │   └── utils/            # Utilities
│   ├── package.json
│   ├── vite.config.js
│   └── README_ARCHITECTURE.md
│
├── backend/
│   ├── apps/
│   │   ├── academique/       # App académique
│   │   ├── etudiants/        # App étudiants
│   │   ├── enseignants/      # App enseignants
│   │   └── pfes/             # App PFEs
│   ├── config/               # Configuration
│   ├── middlewares/          # Middlewares
│   ├── validators/           # Validators
│   ├── utils/                # Utilities
│   ├── manage.py
│   ├── requirements.txt
│   └── README_ARCHITECTURE.md
│
├── ARCHITECTURE.md
├── MIGRATION_GUIDE.md
└── README.md
```

---

## 🤝 Contributeurs

- **Développeur:** Khalil
- **Dernière mise à jour:** Mai 2026
- **Version:** 2.0 (Architecture Refactorisée)

---

## 📝 License

Propriétaire - 2026

---

## 📞 Support

Pour les questions ou problèmes:

1. Consultez la [documentation](ARCHITECTURE.md)
2. Vérifiez le [guide de dépannage](MIGRATION_GUIDE.md#dépannage)
3. Contactez l'équipe de développement

---

## 🎯 Roadmap

- [ ] Tests automatisés (Phase 2)
- [ ] State management avec Redux (Phase 2)
- [ ] Mobile app (Phase 3)
- [ ] API GraphQL (Phase 3)
- [ ] Real-time notifications (Phase 3)
- [ ] Intégration email avancée (Phase 3)

---

## ✅ Checklist de déploiement

- [ ] Backend tests passent
- [ ] Frontend build réussit
- [ ] Variables d'environnement configurées
- [ ] Base de données migrated
- [ ] Credentials changés
- [ ] CORS configuré
- [ ] SSL/HTTPS activé
- [ ] Backups en place

---

**Merci d'utiliser UniManage ! 🎉**

Pour plus d'informations, visitez la documentation complète dans [ARCHITECTURE.md](ARCHITECTURE.md)
