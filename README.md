# 📚 Gestion Départements v2.0

**Système complet de gestion académique pour universités et instituts.**

## 🚀 Démarrage rapide

### Installation

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py runserver 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Credentials par défaut
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Changez ces credentials en production !**

## 📂 Structure du projet

```
gestion_departements/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages principales
│   │   ├── services/      # API centralisée
│   │   ├── routes/        # Configuration routes
│   │   ├── utils/         # Validators, formatters
│   │   └── constants/     # Constants app
│   └── package.json
│
├── backend/              # Django + DRF
│   ├── academique/        # Module académique
│   ├── enseignants/       # Module enseignants
│   ├── etudiants/         # Module étudiants
│   ├── pfes/              # Module PFEs
│   ├── gestion_departements/  # Config Django
│   └── manage.py
│
├── ARCHITECTURE.md       # Guide architecture
├── EXEMPLES.md          # Exemples code
└── docs/archive/        # Docs historiques
```

## 🎯 Fonctionnalités

### Frontend
- 🎨 Interface React moderne avec Vite
- 🔐 Authentification par token JWT
- 📊 Dashboard avec statistiques
- 🗂️ Gestion CRUD complète (Départements, Étudiants, Enseignants, PFEs)
- ✅ Validation de formulaires intégrée
- 📱 Design responsive

### Backend
- 🐍 Django 5.2 avec Django REST Framework
- 🔌 API RESTful robuste
- 📊 Gestion de base de données PostgreSQL
- 🔐 Token-based authentication
- 📁 Uploads de fichiers (photos étudiants, etc.)
- 🤖 Intégration IA (Groq LLaMA 3)

## 📖 Documentation

### Pour démarrer rapidement
1. Lire [ARCHITECTURE.md](ARCHITECTURE.md) - Vue d'ensemble
2. Consulter [EXEMPLES.md](EXEMPLES.md) - Exemples code

### Documentation archivée (optionnel)
- [docs/archive/MIGRATION_GUIDE.md](docs/archive/MIGRATION_GUIDE.md) - Guide de migration
- [docs/archive/RESTRUCTURATION_COMPLETE.md](docs/archive/RESTRUCTURATION_COMPLETE.md) - Résumé restructuration
- [docs/archive/FRONTEND_ARCHITECTURE.md](docs/archive/FRONTEND_ARCHITECTURE.md) - Détails frontend
- [docs/archive/BACKEND_ARCHITECTURE.md](docs/archive/BACKEND_ARCHITECTURE.md) - Détails backend

## 🔧 Tech Stack

### Frontend
- React 18+
- Vite
- React Router v6
- Axios
- CSS3

### Backend
- Django 5.2
- Django REST Framework
- PostgreSQL
- Django CORS Headers
- Groq API (IA)

## 🛠️ Développement

### Frontend
```bash
cd frontend
npm run dev        # Démarrer le serveur dev
npm run build      # Build production
npm run preview    # Preview production
```

### Backend
```bash
cd backend
python manage.py runserver 8000        # Démarrer dev server
python manage.py makemigrations        # Créer migrations
python manage.py migrate               # Appliquer migrations
python manage.py createsuperuser       # Créer admin
```

## 🐛 Troubleshooting

### "Cannot find module..."
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Port déjà utilisé
```bash
# Frontend (changez le port dans vite.config.js)
# Backend
python manage.py runserver 8001
```

### Base de données
```bash
# Reset complet (perte de données!)
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

## 📝 Conventions

### Frontend
- Components: PascalCase (`MyComponent.jsx`)
- Hooks: camelCase avec prefix `use` (`useAuth.js`)
- Files: PascalCase (components), camelCase (utils/services)
- CSS: modular (`ComponentName.css`)

### Backend
- Models: PascalCase (Django convention)
- Functions: snake_case
- Classes: PascalCase
- Files: snake_case

## 🔐 Sécurité

### En développement
- SECRET_KEY dans .env (fourni)
- DEBUG = True
- Base SQLite

### En production
- SECRET_KEY généré et secret
- DEBUG = False
- PostgreSQL
- HTTPS enforced
- CORS strictement configuré
- Credentials changés

## 📞 Support

Pour les questions:
1. Vérifier [ARCHITECTURE.md](ARCHITECTURE.md)
2. Consulter [EXEMPLES.md](EXEMPLES.md)
3. Lire les docs archivées

## 📄 License

Propriétaire - Usage interne uniquement

---

**Version:** 2.0  
**Dernière mise à jour:** 2026-05-24  
**Status:** Production-Ready ✅
