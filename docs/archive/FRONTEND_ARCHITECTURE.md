# 📱 Frontend Architecture

## 📂 Structure des dossiers

```
src/
├── components/          # Composants React réutilisables
│   ├── common/         # Composants génériques
│   ├── forms/          # Tous les formulaires
│   ├── tables/         # Tous les affichages tableau
│   ├── pages/          # Composants spécifiques aux pages
│   └── layout/         # Layout components
├── pages/              # Pages principales
├── services/           # Couche API (appels HTTP)
├── routes/             # Configuration des routes
├── styles/             # CSS global
├── layouts/            # Layout wrappers
├── hooks/              # Custom React hooks
├── context/            # Context API (global state)
├── assets/             # Images et icônes
├── constants/          # Constantes d'application
└── utils/              # Utilitaires (validators, formatters, etc)
```

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
cd frontend
npm install
```

### 2. Lancer le serveur de développement
```bash
npm run dev
```

### 3. Construire pour la production
```bash
npm run build
```

## 🛠️ Utilisation des Services

Les services centralisent tous les appels API. À utiliser à la place d'axios directement.

### Exemple: Récupérer les étudiants
```javascript
import { etudiants } from '../services';

const GestionEtudiants = () => {
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    etudiants.getEtudiants()
      .then(data => setStudents(data))
      .catch(error => console.error('Erreur:', error));
  }, []);
  
  return (
    // Component JSX
  );
};
```

### Exemple: Créer un étudiant
```javascript
const handleCreate = async (studentData) => {
  try {
    const newStudent = await etudiants.createEtudiant(studentData);
    setStudents([...students, newStudent]);
  } catch (error) {
    console.error('Erreur de création:', error);
  }
};
```

## 📋 Services disponibles

Tous dans `src/services/index.js`:

### Académique
```javascript
academique.getDepartements()
academique.createDepartement(data)
academique.updateDepartement(id, data)
academique.deleteDepartement(id)

academique.getLicences()
academique.getSpecialites()
academique.getModules()
```

### Étudiants
```javascript
etudiants.getEtudiants()
etudiants.createEtudiant(data)
etudiants.updateEtudiant(id, data)
etudiants.deleteEtudiant(id)
etudiants.importEtudiants(file)
```

### Enseignants
```javascript
enseignants.getEnseignants()
enseignants.createEnseignant(data)
enseignants.updateEnseignant(id, data)
enseignants.deleteEnseignant(id)
```

### PFEs
```javascript
pfes.getPFEs()
pfes.createPFE(data)
pfes.getSoutenances()
pfes.getDashboardStats()
```

### Authentification
```javascript
auth.login(username, password)
auth.logout()
auth.changePassword(oldPassword, newPassword)
```

## 🎨 Composants

### Importer des composants
```javascript
// ❌ Ancien style (ne plus utiliser)
import DepartementForm from '../../../components/DepartementForm';

// ✅ Nouveau style (utiliser index.js)
import { DepartementForm } from '../components/forms';
import { DepartementTable } from '../components/tables';
import { ErrorBoundary } from '../components/common';
```

## 🔧 Utils

### Validators
```javascript
import { validateEmail, validatePhone, validateCIN } from '../utils/validators';

if (!validateEmail(email)) {
  console.error('Email invalide');
}
```

### Formatters
```javascript
import { formatDate, formatPhone, truncateText } from '../utils/formatters';

const displayDate = formatDate(new Date(), 'dd/MM/yyyy');
const displayPhone = formatPhone('21612345678');
```

## 🌐 Routes

Toutes les routes sont configurées dans `src/routes/index.js`.

### Ajouter une nouvelle route
1. Créer le composant page
2. L'importer dans `routes/index.js`
3. L'ajouter à `protectedRoutes` ou `publicRoutes`
4. La route apparaît automatiquement dans la navigation

```javascript
// routes/index.js
export const protectedRoutes = [
  {
    path: '/ma-page',
    component: MaPage,
    name: 'Ma Page',
    icon: '📄',
  },
];
```

## 📝 Conventions de nommage

- **Composants:** PascalCase - `EtudiantForm.jsx`
- **Services:** camelCase - `etudiants.js`
- **Hooks:** camelCase avec `use` - `useAuth.js`
- **Utils:** camelCase - `validators.js`
- **Constantes:** UPPER_CASE - `API_URL`

## 🧪 Tester en local

1. Backend doit tourner sur `http://localhost:8000`
2. Frontend tourne sur `http://localhost:5173`
3. Proxy Vite automatiquement redirige `/api/` vers le backend

## 📦 Build et déploiement

```bash
# Build production
npm run build

# Fichiers générés dans dist/
# À déployer sur serveur HTTP
```

## 🐛 Debugging

- DevTools React: Installer l'extension React DevTools
- Console: F12 et onglet Console
- Network: Voir les requêtes API dans Network tab

## 📚 Ressources

- React: https://react.dev
- React Router: https://reactrouter.com
- Axios: https://axios-http.com
- Vite: https://vitejs.dev
