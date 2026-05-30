# 🎓 UniManage - Technical Defense & Presentation Guide

**Project Name:** Gestion des Départements (Department Management System)  
**Tech Stack:** Django + React + PostgreSQL  
**Architecture:** REST API + Modern Frontend

---

## 📋 TABLE OF CONTENTS
1. Architecture Overview
2. Backend Analysis (Django)
3. Frontend Analysis (React)
4. Complete Data Flow
5. Key Technical Decisions
6. Interview Questions & Answers

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 High-Level Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     React SPA Frontend                      │
│              (Vite + React Router + Axios)                  │
│  • Components: Tables, Forms, Charts (Recharts)             │
│  • State: Component-level + localStorage for auth           │
│  • Services: Centralized API layer (services/index.js)      │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
                    (Token Authorization)
┌─────────────────────────────────────────────────────────────┐
│               Django REST Framework Backend                  │
│           (PostgreSQL + REST API + Token Auth)              │
│  • 4 Django Apps: academique, enseignants, etudiants, pfes  │
│  • ViewSets: Automatic CRUD + Custom @action endpoints      │
│  • Authentication: Token-based (REST Framework)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│    (Normalized schema with ForeignKey relationships)        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Communication Pattern

**Frontend → Backend:**
- REST API calls via Axios
- Token-based authentication in headers: `Authorization: Token {token}`
- JSON request/response bodies
- Error handling with interceptors (auto-logout on 401)

**Base URL Configuration:**
- Frontend uses `VITE_API_URL` environment variable or defaults to `/api`
- All API calls prepended with `/api/` (relative paths: `etudiants/`, `enseignants/`, etc.)

### 1.3 Technology Stack & Why These Choices

| Component | Technology | Why? |
|-----------|-----------|------|
| **Backend Framework** | Django + DRF | Rapid development, ORM, built-in admin, excellent for academic data |
| **Database** | PostgreSQL | Relational integrity (ForeignKeys), ACID compliance, JSON field support |
| **Frontend Framework** | React | Component reusability, fast rendering, large ecosystem |
| **Frontend Build Tool** | Vite | Fast development server, optimized production builds |
| **Charts** | Recharts | React-native charts library, easy integration |
| **HTTP Client** | Axios | Interceptors for auth, error handling, simpler than Fetch |
| **Authentication** | Token Auth | Stateless, scalable, REST-friendly (vs session-based) |
| **CORS** | django-cors-headers | Allow frontend to call backend from different domain/port |

---

## 2. BACKEND ANALYSIS (Django)

### 2.1 Database Schema & Models

#### **ACADEMIQUE APP** (Core Academic Structure)

```
Departement (Department)
├── id (Primary Key)
├── nom (Name) - Unique
├── code (Code) - Unique
├── description, email, telephone
├── photo (FileField)
├── responsable (Department Head Name)
└── date_creation, date_modification

Licence (Degree Program)
├── id
├── nom - Unique
├── domaine, mention, parcours
├── description, duree (duration)
├── departement_id → ForeignKey(Departement)
└── date_creation, date_modification

Specialite (Specialty within License)
├── id
├── nom, code
├── description
├── licence_id → ForeignKey(Licence)
└── Unique constraint: (nom, licence)

Module (Course Unit - "Unité d'Enseignement")
├── id
├── nom (Unit name)
├── code, description
├── matieres (JSONField) - List of course components with volumes
├── credit_ue, coefficient_ue (Credits & coefficient for unit)
├── semestre (S1-S6) - Semester
├── annee (L1, L2, L3) - Year
├── licence_id → ForeignKey(Licence)
├── specialite_id → ForeignKey(Specialite, nullable)
└── date_creation, date_modification

UEElement (Teachable Component)
├── id
├── nom (Component name - "matière")
├── code, coefficient, credit
├── vh_c, vh_td, vh_tp, vh_ci (Teaching volumes)
├── sections, groupes_td, sous_groupes_tp (Group counts)
├── etudiants (Student count)
├── module_id → ForeignKey(Module)
├── enseignant_id → ForeignKey(Enseignant, nullable)
└── Method: total_heures() - Calculates all teaching hours

AffectationDetail (Teacher Assignment to Component)
├── id
├── ue_element_id → ForeignKey(UEElement)
├── enseignant_id → ForeignKey(Enseignant)
├── type_affectation (C=Cours, TD, TP, CI)
└── (Other assignment-specific fields)
```

**Key Relationships:**
- Departement → Licence (1:Many)
- Licence → Specialite (1:Many)
- Licence → Module (1:Many)
- Module → UEElement (1:Many)
- UEElement → Enseignant (Many:1)
- UEElement → AffectationDetail (1:Many)

#### **ENSEIGNANTS APP** (Teacher Management)

```
Enseignant (Teacher)
├── matricule (Primary Key) - Unique identifier
├── user_id → OneToOneField(User, nullable)
├── role (admin, chef_departement, enseignant)
├── cin (National ID) - Unique
├── nom, prenom, email (Unique), numtel
├── grade (Academic grade: Dr., Pr., etc.)
├── dateRecrutement, statutAdministratif
├── plafond_pfe (Individual PFE capacity limit)
├── plafond_enseignement (Teaching hours limit)
├── departement_id → ForeignKey(Departement, nullable)
└── Many: ue_elements (as enseignant), affectations_details, etc.

Grade (Academic Grade)
├── idGrade
├── nomGrade (Unique) - e.g., "Doctorat", "Master"

EnseignantGrade (Grade History)
├── matricule → ForeignKey(Enseignant)
├── grade → ForeignKey(Grade)
├── dateDebut, dateFin
└── Unique: (matricule, grade, dateDebut)

Diplome (Diploma)
├── idDiplome
├── libelleDiplome, specialite
├── universite, dateObtention

EnseignantDiplome (Teacher Diploma Record)
├── matricule → ForeignKey(Enseignant)
├── idDiplome → ForeignKey(Diplome)
├── dateObtention
└── Unique: (matricule, idDiplome)

Titre (Base Position/Title - Inheritance Base)
├── idTitre
├── dateDebutTitre
├── enseignant_id → ForeignKey(Enseignant)

Permanent (Permanent Position)
├── idTitre (Inherits from Titre)
├── dateTitularisation
├── anneeInscription

Vacataire (Part-time Position)
├── idTitre
├── nbHeures, tauxHoraire

Contractuel (Contract Position)
├── idTitre
├── dureeContrat, dateDebutContrat, dateFinContrat

ContratDocteur (Doctor Contract)
├── contractuel_id → OneToOneField(Contractuel, Primary Key)
├── primeRecherche (Research allowance)
├── numeroOrdre

ContratDoctorant (PhD Candidate Contract)
├── contractuel_id → OneToOneField(Contractuel)
├── sujetThese (Thesis subject)
├── universiteInscription, anneeInscription
```

**Key Relationships:**
- Enseignant → User (1:1) - Django User for authentication
- Enseignant → Departement (Many:1)
- Enseignant → Titre (1:Many, polymorphic via inheritance)
- Titre can be Permanent, Vacataire, or Contractuel
- Contractuel → ContratDocteur/ContratDoctorant (1:1)

#### **ETUDIANTS APP** (Student Management)

```
Etudiant (Student)
├── idEtudiant (Primary Key)
├── cin (National ID) - Unique
├── passport (Optional international ID)
├── nationalite
├── nom_fr, prenom_fr, email (Unique), numTel
├── dateNaissance, adresse
├── genre (M/F)
├── situation_s5 (N=New, R=Repeater)
├── situation_pfe (N=New, R=Repeater)
├── annee_universitaire (e.g., "2025/2026")
├── groupe (Group designation)
└── licence_id → ForeignKey(Licence, nullable)
```

#### **PFES APP** (PFE/Project Management)

```
ParametresPfe (Global PFE Settings - Singleton)
├── id (always 1)
├── plafond_groupes (Group capacity limit for supervisors)

Salle (Classroom/Room)
├── id
├── nom (Name) - Unique
└── Meta: ordering by name

Rapporteur (Independent Rapporteur/Reviewer)
├── matricule (Primary Key)
├── cin (Unique), nom, prenom
├── email (Unique), numtel
├── grade, dateRecrutement, statutAdministratif

PFE (Project/Internship)
├── idPfe (Primary Key)
├── sujet (Project subject)
├── duree (Duration in months)
├── specialite, type_projet
├── encadrant_id → ForeignKey(Enseignant, PROTECT, nullable)
├── etudiants (Many:Many through PFEStudent)
├── date_affectation, lieu_stage (Internship location)
├── convention_file, lettre_affectation_file
└── Validation: max 2 students per PFE

PFEStudent (Student-PFE Assignment)
├── pfe_id → ForeignKey(PFE)
├── etudiant_id → OneToOneField(Etudiant)
└── 1 student can only be in 1 PFE

Soutenance (Defense/Presentation)
├── idSoutenance
├── pfe_id → ForeignKey(PFE, nullable)
├── type_soutenance (technique, finale)
├── date_soutenance, heure_soutenance (time)
├── duree (Duration in minutes)
├── salle (Room number)
├── encadrant_id → ForeignKey(Enseignant, PROTECT)
├── rapporteur_id → ForeignKey(Enseignant, PROTECT)
├── etudiants (Many:Many)
├── resultat_technique, resultat_finale
├── depot_electronique, depot_papier (Boolean flags)
└── Meta: ordering by date DESC
```

**Key Relationships:**
- PFE → Enseignant (Many:1) as supervisor
- PFE ← → Etudiant (Many:Many through PFEStudent)
- Soutenance → PFE (Many:1)
- Soutenance → Enseignant (2 ForeignKeys: supervisor + rapporteur)
- Soutenance ← → Etudiant (Many:Many)

---

### 2.2 ViewSets & API Endpoints

#### **DepartementViewSet** (`/api/departements/`)

```python
ENDPOINTS:
- GET    /api/departements/           → List all (filtered by user role)
- POST   /api/departements/           → Create new
- GET    /api/departements/{id}/      → Retrieve one
- PUT    /api/departements/{id}/      → Full update
- PATCH  /api/departements/{id}/      → Partial update
- DELETE /api/departements/{id}/      → Delete
- POST   /api/departements/import-excel/ → Batch import

KEY FEATURES:
1. Authorization: get_queryset() filters by user role
   - Superuser → all departments
   - Admin → all departments
   - Chef_departement → only their own department
   
2. perform_create() hook:
   - Auto-creates Django User & Enseignant for department head
   - Sets up login credentials (email as username, code as password)
   
3. perform_update() hook:
   - Updates User and Enseignant when email/code changes
   
4. import_excel() @action:
   - Supports .xlsx, .xls, .csv files
   - Flexible column mapping (nom, name, code, responsable, etc.)
   - Returns detailed report with created count & errors
```

#### **LicenceViewSet** (`/api/licences/`)

```python
ENDPOINTS:
- GET    /api/licences/                    → List
- POST   /api/licences/                    → Create
- GET    /api/licences/{id}/               → Retrieve
- PUT    /api/licences/{id}/               → Update
- DELETE /api/licences/{id}/               → Delete
- GET    /api/licences/by_departement/     → Filter by department
- POST   /api/licences/import-excel/       → Batch import

AUTHORIZATION:
- same role-based filtering as Departement
```

#### **SpecialiteViewSet** (`/api/specialites/`)

```python
Similar structure to Licence
- GET /api/specialites/by_licence/ (query param: licence_id)
- Supports cascading filters (department → license → specialty)
```

#### **ModuleViewSet** (`/api/modules/`)

```python
ENDPOINTS:
- GET /api/modules/                    → List (filters: licence, specialite, semestre, annee)
- POST /api/modules/                   → Create
- GET /api/modules/{id}/               → Retrieve
- GET /api/modules/by_specialite/      → Filter by specialty
- GET /api/modules/by_licence/         → Filter by license
- GET /api/modules/by_semestre/        → Filter by semester

SPECIAL FIELDS:
- matieres: JSONField storing list of course components
  ```json
  [
    {
      "nom": "Web Dev",
      "vh_c": 20,
      "vh_td": 15,
      "vh_ci": 10,
      "credit": 3,
      "coefficient": 1.5
    }
  ]
  ```
```

#### **UEElementViewSet** (`/api/ue-elements/`)

```python
ENDPOINTS:
- GET /api/ue-elements/     (filters: module, specialite, licence)
- POST /api/ue-elements/
- GET /api/ue-elements/{id}/
- PUT/PATCH/DELETE

INCLUDES:
- Volume horaire calculations (vh_c, vh_td, vh_tp, vh_ci)
- Group/section counts
- Teacher assignment (enseignant_id)
- Method: total_heures() computes all teaching hours
```

#### **EnseignantViewSet** (`/api/enseignants/`)

```python
ENDPOINTS:
- GET    /api/enseignants/              → List (paginated, page_size=100)
- POST   /api/enseignants/              → Create
- GET    /api/enseignants/{matricule}/  → Retrieve (uses matricule as key, not id)
- PUT    /api/enseignants/{matricule}/  → Update
- DELETE /api/enseignants/{matricule}/  → Delete (protected if in PFE/Soutenance)
- POST   /api/enseignants/import-excel/ → Intelligent batch import

IMPORT FEATURES (Most sophisticated in codebase):
- Auto-detects file format (.xlsx, .xls, .csv)
- Intelligent column mapping (handles variations like 'nom' vs 'nom_fr')
- Data cleaning: phone numbers, dates, string trimming
- CamelCase conversion (daterecrutement → dateRecrutement)
- Required field validation with flexible matching
- Transaction handling: all-or-nothing imports
- Detailed ImportReporter with line-level error tracking
- Preserves existing records (update if matricule exists)

DELETE PROTECTION:
- ProtectedError if teacher is:
  - Assigned as encadrant (supervisor) to a PFE
  - Assigned as rapporteur to a Soutenance
```

#### **EtudiantViewSet** (`/api/etudiants/`)

```python
ENDPOINTS:
- GET    /api/etudiants/              → List (paginated)
- POST   /api/etudiants/              → Create
- GET    /api/etudiants/{idEtudiant}/ → Retrieve
- PUT    /api/etudiants/{idEtudiant}/ → Update
- DELETE /api/etudiants/{idEtudiant}/ → Delete
- POST   /api/etudiants/import-excel/ → Batch import (similar to enseignants)

KEY FIELDS:
- annee_universitaire: Dynamically set by frontend (e.g., "2025/2026")
- licence: Links to Licence model for degree program
- situation_s5, situation_pfe: Track if new or repeating
```

#### **PFEViewSet** (`/api/pfes/`)

```python
ENDPOINTS:
- GET    /api/pfes/                   → List
- POST   /api/pfes/                   → Create
- GET    /api/pfes/{idPfe}/           → Retrieve
- PUT    /api/pfes/{idPfe}/           → Update
- DELETE /api/pfes/{idPfe}/           → Delete
- GET    /api/pfes/parametres/        → Get global settings
- PATCH  /api/pfes/parametres/        → Update settings (body: {plafond_groupes})
- POST   /api/pfes/import-excel/      → Returns 503 (not implemented)

LOGIC:
- Many:Many to Etudiant through PFEStudent
- clean() method validates max 2 students per PFE
- encadrant must not be a ContratDoctorant/ContratDocteur
```

#### **SoutenanceViewSet** (`/api/soutenances/`)

```python
ENDPOINTS:
- GET    /api/soutenances/            → List
- POST   /api/soutenances/            → Create
- GET    /api/soutenances/{idSoutenance}/
- PUT/PATCH/DELETE

CONSTRAINTS:
- encadrant: PROTECT foreign key (teacher supervision records)
- rapporteur: PROTECT foreign key (teacher evaluation records)
- type_soutenance: 'technique' or 'finale'
- Both depot_electronique & depot_papier tracked
```

#### **Authentication Endpoints**

```python
POST /api-token-auth/        → Login (returns token + role)
POST /api/change-password/   → Change password (requires auth)
GET  /api/dashboard/stats/   → PFE statistics
```

---

### 2.3 Authentication & Authorization Mechanism

**Token-Based Authentication:**

```python
# Backend (gestion_departements/views.py)
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # Django's standard token auth
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Return comprehensive user info
        return Response({
            'token': token.key,           # Used in Authorization header
            'role': role,                 # admin, chef_departement, enseignant
            'departement_id': dept_id,
            'matricule': matricule,
            'user_id': user.pk,
            'email': user.email
        })
```

**Authorization Pattern:**

```python
class IsAdminOrChefDepartement(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            enseignant = getattr(request.user, 'enseignant', None)
            if not enseignant:
                return False
            role = getattr(enseignant, 'role', '')
            return role in ['admin', 'chef_departement']
        except Exception:
            return False
```

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|------------|
| **admin** | Full access to all data, all endpoints |
| **chef_departement** | Limited to their own department + their users |
| **enseignant** | View own profile, assigned PFEs/courses |
| **Superuser** | Django superuser - all access |

**Row-Level Security (RLS):**

```python
# Example from DepartementViewSet.get_queryset()
def get_queryset(self):
    user = self.request.user
    if getattr(user, 'is_superuser', False):
        return Departement.objects.all()
    
    enseignant = getattr(user, 'enseignant', None)
    if not enseignant:
        return Departement.objects.none()
    
    role = getattr(enseignant, 'role', '')
    if role == 'admin':
        return Departement.objects.all()
    elif role == 'chef_departement' and enseignant.departement_id:
        return Departement.objects.filter(id=enseignant.departement_id)
    
    return Departement.objects.none()
```

---

### 2.4 Business Logic & Services

#### **Excel/CSV Import System** (utils/excel_utils.py)

**Key Classes:**
1. **ColumnMapper** - Intelligent column detection & mapping
   - Detects variations: "nom" vs "name", "dateRecrutement" vs "date_recrutement"
   - Tracks mapped, ignored, and missing columns
   
2. **DataCleaner** - Data normalization
   - Phone number formatting
   - Date parsing
   - String trimming
   - Type conversion
   
3. **ImportReporter** - Detailed logging
   - Tracks successful imports
   - Tracks errors with line numbers
   - Generates summary reports
   
4. **read_file_intelligent()** - Format detection
   - Automatically detects .xlsx, .xls, .csv
   - Returns headers and rows

**Flow:**
```
Upload File → read_file_intelligent() 
  → ColumnMapper.map_row()
  → DataCleaner.clean_row()
  → Validate required fields
  → Create/Update objects
  → ImportReporter.add_*()
  → Return detailed report
```

#### **Dashboard Statistics** (academique/ai_views.py)

```python
GET /api/dashboard/stats/
Returns:
{
  "pourcentage_depot": 85.5,           # % students submitted PFE
  "etudiants_ayant_depose": 153,       # count submitted
  "total_etudiants": 179,              # total count
  
  "taux_reussite_technique": 78.2,     # % technical defense passed
  "taux_reussite_finale": 81.5,        # % final defense passed
  
  "soutenances_validees": 120,         # technical defenses passed
  "soutenances_non_validees": 35,      # technical defenses failed
  "soutenances_finale_validees": 130,  # final defenses passed
  "soutenances_finale_non_validees": 25,
  
  "pct_monome": 35.2,                  # % solo students
  "pct_binome": 64.8,                  # % paired students
  
  "taux_reussite_hommes": 82.3,        # by gender
  "taux_reussite_femmes": 79.1,
  
  "stats_departements": [              # per-department stats
    {
      "departement": "Informatique",
      "taux_reussite": 85.5,
      "total": 45
    }
  ],
  
  "lieux_stage": [                     # internship locations
    {
      "lieu_stage": "TechCorp",
      "count": 12
    }
  ]
}
```

---

### 2.5 URL Routing Structure

```python
# settings.py
INSTALLED_APPS = [
    'academique',
    'enseignants',
    'etudiants',
    'pfes',
]

# urls.py
urlpatterns = [
    path('api/', include('enseignants.urls')),     # /api/enseignants/
    path('api/', include('etudiants.urls')),       # /api/etudiants/
    path('api/', include('pfes.urls')),            # /api/pfes/
    path('api/', include('academique.urls')),      # /api/academique/ prefix issues
    path('api-token-auth/', CustomAuthToken.as_view()),
    path('api/change-password/', ChangePasswordView.as_view()),
]

# academique/urls.py
router = DefaultRouter()
router.register(r'departements', DepartementViewSet)
router.register(r'licences', LicenceViewSet)
router.register(r'specialites', SpecialiteViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'ue-elements', UEElementViewSet)

urlpatterns = [
    path('', include(router.urls)),  # /api/departements/, etc
]
```

**⚠️ Routing Note:** Academique app's urls.py includes router without a prefix, so endpoints are `/api/departements/` instead of `/api/academique/departements/`.

---

## 3. FRONTEND ANALYSIS (React)

### 3.1 Component Architecture & Hierarchy

**Top-Level Structure:**

```
App.jsx (Main Router)
├── Layout (Wrapper with sidebar)
│   ├── Sidebar Navigation
│   └── <Outlet /> (Page components)
│
├── Login.jsx (Public route - /login)
│
└── Protected Routes (Require token):
    ├── Dashboard.jsx                    (/)
    ├── GestionEtudiants.jsx             (/etudiants)
    ├── GestionEnseignants.jsx           (/enseignants)
    ├── GestionPFEs.jsx                  (/pfes)
    ├── GestionEncadrants.jsx            (/encadrants)
    ├── GestionRapporteurs.jsx           (/rapporteurs)
    ├── GestionSoutenances.jsx           (/soutenances)
    ├── GestionDepartements.jsx          (/departements)
    ├── GestionLicences.jsx              (/licences)
    ├── GestionAffectationsAcademiques.jsx (/affectations)
    ├── GestionModules.jsx               (/modules)
    └── GestionSpecialites.jsx           (/specialites)
```

### 3.2 Page-Level Components (Data Management Pages)

**Pattern: Each page follows this structure**

```
GestionEtudiants.jsx (Student Management Example)
│
├── State Management
│   ├── etudiants: [] - fetched from API
│   ├── selected: null - for edit mode
│   ├── showForm: boolean - toggle form visibility
│   ├── searchTerm: string - filter search
│   ├── filterBy: array - which fields to search in
│   ├── selectedEtudiants: Set - for batch operations
│   ├── licences: [] - dropdown options
│   ├── specialites: [] - dropdown options
│   └── anneeUniversitaire: "2025/2026" - academic year
│
├── useEffect Hooks
│   ├── loadData() - GET /api/etudiants/ + related dropdowns
│   └── cleanup on unmount
│
├── CRUD Functions
│   ├── loadData()       - GET list
│   ├── handleAddOrUpdate() - POST (create) / PUT (update)
│   ├── handleDelete()   - DELETE
│   └── handleSearch()   - Filter locally
│
├── Sub-Components
│   ├── <EtudiantsTable />
│   │   ├── Display rows, search results
│   │   ├── Edit/Delete buttons
│   │   └── Props: data, onEdit, onDelete, searchTerm, filterBy
│   │
│   ├── <EtudiantForm />
│   │   ├── Create/Edit form
│   │   ├── Form validation
│   │   ├── Props: initialData, licences, onSubmit, onCancel
│   │   └── Dropdown for licence selection
│   │
│   └── Import Section
│       ├── File input
│       ├── Preview (parseFile utility)
│       └── Batch import POST /api/etudiants/import-excel/
│
└── Render
    ├── Search bar (text + multi-select filter)
    ├── Add button
    ├── Import button
    ├── Table OR Form (toggled)
    └── Messages (success/error)
```

### 3.3 Reusable Components

| Component | Purpose | Props |
|-----------|---------|-------|
| **EtudiantsTable** | Display student list | data, onEdit, onDelete, searchTerm, filterBy |
| **EtudiantForm** | Create/edit student | initialData, onSubmit, onCancel, licences |
| **EnseignantsTable** | Display teachers | Similar pattern |
| **EnseignantForm** | Create/edit teacher | ... |
| **PFEsTable** | Display PFE projects | ... |
| **PFEForm** | Create/edit PFE | encadrants, etudiants dropdowns |
| **SoutenancesTable** | Display defenses | ... |
| **SoutenanceForm** | Create/edit defense | encadrants, rapporteurs, salles dropdowns |
| **MultiSelectDropdown** | Multi-select UI | options, selected, onChange, placeholder |
| **AffectationKanban** | Drag-drop assignment board | (for academic assignments) |
| **ChatAssistant** | AI sidebar | (integrated via Groq API) |
| **ChangePasswordModal** | Password change dialog | onSuccess, onCancel |
| **ErrorBoundary** | Error handling wrapper | children |

### 3.4 API Communication & Services

**Service Layer** (`src/services/index.js`):

```javascript
// Centralized API service definitions
export const academique = {
  getDepartements: () => axios.get('/academique/departements/'),
  createDepartement: (data) => axios.post('/academique/departements/', data),
  // ... other CRUD operations
};

export const etudiants = {
  getEtudiants: () => axios.get('/etudiants/'),
  createEtudiant: (data) => axios.post('/etudiants/', data),
  importEtudiants: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/etudiants/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const auth = {
  login: (username, password) => axios.post('/api-token-auth/', { username, password }),
  changePassword: (oldPassword, newPassword) => 
    axios.post('/change-password/', { old_password: oldPassword, new_password: newPassword }),
};
```

**Axios Configuration** (`src/utils/axiosConfig.js`):

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request Interceptor: Add token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-logout on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage & redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3.5 Routing Mechanism

**React Router Setup** (`App.jsx`):

```javascript
<Routes>
  {/* Public route */}
  <Route path="/login" element={<Login onLogin={handleLogin} />} />
  
  {/* Protected routes - require token */}
  {token ? (
    <Route element={<Layout role={role}><ChatAssistant /></Layout>}>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/etudiants" element={<GestionEtudiants />} />
      <Route path="/enseignants" element={<GestionEnseignants />} />
      {/* ... other protected routes */}
    </Route>
  ) : null}
  
  {/* Fallback */}
  <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
</Routes>
```

**Route Guard:**
- Token from `localStorage` checked in `useEffect`
- Login page redirects authenticated users to `/dashboard`
- Other routes redirect unauthenticated users to `/login`
- 401 responses trigger immediate logout

### 3.6 State Management Approach

**Current Approach: Minimal & Component-Level**

```javascript
// localStorage: Persists across sessions
localStorage.getItem('token')      // API authentication
localStorage.getItem('role')       // User role for UI

// Component State: useState hooks
const [data, setData] = useState([])
const [selected, setSelected] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

// No Redux/Context API (Intentional for simplicity)
// Each page manages its own state
```

**Why This Works:**
- Small to medium-sized application
- Minimal cross-component state sharing
- Simple token-based auth
- Backend drives most data

---

### 3.7 Form Handling Pattern

**Example: EtudiantForm Component**

```javascript
// Controlled inputs
const [formData, setFormData] = useState(initialData || {});
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Client-side validation
  const newErrors = validateForm(formData);
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  try {
    // Submit to backend
    await onSubmit(formData);  // Parent handles POST/PUT
    // Reset form
    setFormData({});
    setErrors({});
  } catch (err) {
    setErrors({ submit: err.message });
  }
};

// Render
<form onSubmit={handleSubmit}>
  <input name="nom_fr" value={formData.nom_fr} onChange={handleChange} />
  <select name="licence">
    <option value="">Sélectionner une licence</option>
    {licences.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
  </select>
  <button type="submit">Soumettre</button>
</form>
```

---

### 3.8 UI Patterns & Libraries

| Library | Usage |
|---------|-------|
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP requests |
| **Recharts** | Charts (Dashboard) |
| **CSS Modules / CSS Files** | Styling (no Tailwind/Bootstrap) |
| **React Built-ins** | useState, useEffect, useCallback |

**Chart Examples:**
- PieChart: PFE solo vs paired distribution
- BarChart: Success rates by department/gender
- LineChart: Trends over time (if added)

---

## 4. COMPLETE DATA FLOW EXAMPLES

### 4.1 Example 1: Student Creation Flow

**UI Action: User clicks "Add Student" → Fills form → Submits**

```
1. FRONTEND - User Input
   └─ GestionEtudiants.jsx
      └─ User clicks "Ajouter"
         └─ setShowForm(true)
            └─ <EtudiantForm initialData={null} />

2. FRONTEND - Form Submission
   └─ EtudiantForm.jsx
      └─ handleSubmit()
         └─ Validate fields (nom_fr, email, cin, dateNaissance, etc.)
            └─ onSubmit(formData)
               └─ Calls handleAddOrUpdate() in parent

3. FRONTEND - API Request
   └─ GestionEtudiants.jsx::handleAddOrUpdate()
      └─ axios.post('etudiants/', {
           idEtudiant: auto,
           cin: "12345678",
           nom_fr: "Dupont",
           prenom_fr: "Jean",
           email: "jean@example.com",
           dateNaissance: "2000-01-15",
           licence: 5,
           annee_universitaire: "2025/2026",
           ...
         })

4. NETWORK LAYER
   └─ axiosConfig.js::interceptors.request
      └─ Adds Authorization header: "Token abc123xyz"
         └─ Sets Content-Type: application/json
            └─ HTTP POST /api/etudiants/

5. BACKEND - Route Matching
   └─ urls.py
      └─ path('api/', include('etudiants.urls'))
         └─ router.register('etudiants', EtudiantViewSet)
            └─ Calls EtudiantViewSet.create()

6. BACKEND - Permission Check
   └─ EtudiantViewSet.create()
      └─ @authentication_classes([TokenAuthentication])
         └─ @permission_classes([IsAuthenticated])
            └─ Verifies token exists
               └─ Loads user from Token

7. BACKEND - Serializer Validation
   └─ EtudiantSerializer.validate()
      └─ Check unique constraints: email, cin
         └─ Validate date formats
            └─ Validate licence FK exists
               └─ Return cleaned data

8. BACKEND - Database Write
   └─ EtudiantViewSet.perform_create()
      └─ serializer.save()
         └─ Etudiant.objects.create(
              cin="12345678",
              nom_fr="Dupont",
              prenom_fr="Jean",
              email="jean@example.com",
              dateNaissance="2000-01-15",
              licence_id=5,
              annee_universitaire="2025/2026"
            )
            └─ INSERT INTO etudiants_etudiant (...) VALUES (...)
               └─ PostgreSQL commits transaction
                  └─ Returns created object with idEtudiant = 42

9. BACKEND - Response
   └─ serializer.data returns JSON:
      {
        "idEtudiant": 42,
        "cin": "12345678",
        "nom_fr": "Dupont",
        "prenom_fr": "Jean",
        "email": "jean@example.com",
        "licence": 5,
        ...
      }
      └─ Response(status=201 CREATED)

10. FRONTEND - Response Handling
    └─ axios.post() resolves
       └─ GestionEtudiants.jsx::handleAddOrUpdate()
          └─ setSuccessMessage("Étudiant ajouté avec succès")
             └─ loadData()  // Refresh table
                └─ axios.get('etudiants/?page_size=200')
                   └─ setEtudiants([...new list with new student...])
                      └─ Re-render with updated list
                         └─ setShowForm(false)  // Close form
                            └─ UI shows success toast (3 sec timeout)
```

---

### 4.2 Example 2: Login Flow

**UI Action: User enters credentials → Clicks Login**

```
1. FRONTEND - Login Page
   └─ Login.jsx
      └─ User enters username & password
         └─ Clicks "Se connecter"
            └─ handleLogin(e)

2. FRONTEND - API Call
   └─ axios.post('/api-token-auth/', {
        username: "chef_dept@example.com",
        password: "dept_code"
      })

3. NETWORK & BACKEND
   └─ HTTP POST /api-token-auth/
      └─ urls.py → CustomAuthToken.as_view()
         └─ CustomAuthToken.post(request)

4. BACKEND - Authentication
   └─ Django's ObtainAuthToken serializer
      └─ Validates username & password
         └─ Django User.check_password()
            └─ If invalid: 400 Bad Request
            └─ If valid: Continue

5. BACKEND - Token Generation
   └─ Token.objects.get_or_create(user=user)
      └─ Returns or creates token.key = "abc123xyz"

6. BACKEND - Role Determination
   └─ Checks user.is_superuser
      └─ True: role = "admin"
      └─ False: Checks user.enseignant.role
         └─ Returns: role = "chef_departement" (or "enseignant")

7. BACKEND - Response
   └─ Response({
        'token': 'abc123xyz',
        'role': 'chef_departement',
        'departement_id': 3,
        'matricule': 'CHEF_3',
        'user_id': 42,
        'email': 'chef@example.com'
      })

8. FRONTEND - Store Credentials
   └─ localStorage.setItem('token', 'abc123xyz')
      └─ localStorage.setItem('role', 'chef_departement')
         └─ axios.defaults.headers.common['Authorization'] = 'Token abc123xyz'
            └─ setSuccess('Connexion réussie!')

9. FRONTEND - Navigation
   └─ setTimeout(1200ms)
      └─ onLogin('abc123xyz', 'chef_departement')  // Call parent handler
         └─ App.jsx::handleLogin()
            └─ setState(token, role)
               └─ <Routes> re-evaluates protected routes
                  └─ {token ? <Route ... /> : null}  // Now shows
                     └─ navigate('/dashboard')
                        └─ <Dashboard /> renders

10. FRONTEND - Authenticated Requests
    └─ All future axios calls include header
       └─ Authorization: Token abc123xyz
          └─ Backend validates token via TokenAuthentication
             └─ Allows request if token exists & valid
```

---

### 4.3 Example 3: PFE Assignment Flow

**UI Action: Admin assigns students to PFE**

```
1. FRONTEND - GestionPFEs.jsx
   └─ Loads:
      └─ GET /api/pfes/
         └─ GET /api/etudiants/
            └─ GET /api/enseignants/
               └─ GET /api/pfes/parametres/

2. FORM SUBMISSION - Create PFE
   └─ Form data:
      {
        "sujet": "AI-Powered Chat System",
        "duree": 4,
        "specialite": "Informatique",
        "encadrant": 5,          // FK to Enseignant.matricule
        "etudiants": [10, 11],   // Through PFEStudent M2M
        "lieu_stage": "TechCorp",
        "date_affectation": "2025-01-15"
      }

3. FRONTEND - API Request
   └─ axios.post('/api/pfes/', formData)

4. BACKEND - PFEViewSet.create()
   └─ Serializer validation
      └─ Check encadrant exists (Enseignant.matricule=5)
         └─ Check etudiants exist
            └─ Validate: max 2 students
               └─ Validate: no student already in PFE
                  └─ Save PFE

5. BACKEND - M2M Through Model
   └─ PFE.save()
      └─ For each etudiant_id in etudiants:
         └─ PFEStudent.objects.create(
              pfe=pfe,
              etudiant_id=10
            )
         └─ PFEStudent.objects.create(
              pfe=pfe,
              etudiant_id=11
            )

6. DATABASE STATE
   └─ PFE table:
      idPfe | sujet                | duree | encadrant_id | ...
      42    | AI-Powered Chat      | 4     | 5            | ...
   
   └─ PFEStudent table (M2M):
      pfe_id | etudiant_id
      42     | 10
      42     | 11

7. RESPONSE & FRONTEND
   └─ Backend returns PFE object with nested etudiants
      └─ Frontend updates state
         └─ Table re-renders showing PFE with students
            └─ Success message shown

8. FUTURE: Fetch Soutenance for this PFE
   └─ GET /api/soutenances/?pfe=42
      └─ Returns defense records linked to this PFE
         └─ Can edit, add rapporteurs, set dates, etc.
```

---

### 4.4 Example 4: Import Teachers via Excel

**UI Action: User uploads teacher list Excel file**

```
1. FRONTEND - File Selection
   └─ GestionEnseignants.jsx
      └─ <input type="file" accept=".xlsx,.xls,.csv" />
         └─ onChange={handleFileSelect}
            └─ fileRef.current = file
               └─ setImportPreview(parseFile(file))

2. FRONTEND - Preview Generation
   └─ parseFile(file) utility
      └─ Reads first few rows (without backend)
         └─ Shows preview table
            └─ User reviews data
               └─ Clicks "Importer"

3. FRONTEND - Upload Request
   └─ FormData formData = new FormData()
      └─ formData.append('file', fileRef.current)
         └─ axios.post('/api/enseignants/import-excel/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })

4. NETWORK LAYER
   └─ axiosConfig.js::interceptors.request
      └─ Detects FormData
         └─ Sets NO Content-Type (lets browser set with boundary)
            └─ Adds Authorization header

5. BACKEND - File Reception
   └─ EnseignantViewSet.import_excel()
      └─ file = request.FILES.get('file')
         └─ Detects filename.endswith('.csv') or '.xlsx'

6. BACKEND - Intelligent File Reading
   └─ read_file_intelligent(file)
      └─ If CSV: read_csv_file(file)
         └─ If Excel: read_excel_file(file)
            └─ Returns headers dict & rows list
            └─ Example headers: {'matricule': 0, 'nom': 1, 'email': 2}
            └─ Example rows: [
                 (row_num=1, {'matricule': 'E001', 'nom': 'Dupont', ...}),
                 (row_num=2, {'matricule': 'E002', 'nom': 'Martin', ...})
               ]

7. BACKEND - Column Mapping
   └─ ColumnMapper(headers)
      └─ Matches header strings to model fields
         └─ Fuzzy matching: "nom_fr" → "nom"
            └─ Fuzzy matching: "daterecrutement" → "dateRecrutement"
               └─ Tracks mapped_cols, ignored_cols, missing_fields

8. BACKEND - Row Processing (Transaction)
   └─ with transaction.atomic():
      └─ For each row:

      └─ column_mapper.map_row(row_data)
         └─ DataCleaner.clean_row(mapped_row)
            └─ Clean phone: "06 1234 5678" → "0612345678"
               └─ Clean dates: "15/01/2020" → "2020-01-15"
                  └─ Trim strings
                     └─ Case conversion: daterecrutement → dateRecrutement

      └─ validate_required_fields_flexible(
           ['matricule', 'nom', 'prenom', 'email', 'cin', ...]
         )
            └─ If missing: reporter.add_error(row_num, "Missing fields")
               └─ Continue to next row

      └─ Try to find existing: Enseignant.objects.filter(matricule=...)
         └─ If exists: Update with cleaned_row
            └─ If new: Create via EnseignantSerializer

      └─ If error: reporter.add_error(row_num, "Error message")
         └─ Continue (all-or-nothing within transaction)

9. BACKEND - Response Report
   └─ After all rows:
      └─ Report generation:
         {
           "total_processed": 45,
           "imported_count": 43,
           "error_count": 2,
           "warnings": [...],
           "imported_rows": [
             {"row": 1, "matricule": "E001", "nom": "Dupont", ...},
             ...
           ],
           "error_details": [
             {"row": 5, "error": "Email already exists"},
             {"row": 12, "error": "Missing 'cin' field"}
           ]
         }

10. FRONTEND - Result Display
    └─ setImportPreview(report)
       └─ Display detailed results
          └─ Show success count
             └─ Show error table with line numbers
                └─ User can retry or fix errors
                   └─ loadData() to refresh table
```

---

## 5. KEY TECHNICAL DECISIONS & TRADE-OFFS

### 5.1 Architecture Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Token-Based Auth** | Stateless, scalable, REST-friendly | No server-side session revocation (instant token invalidation) |
| **Role-Based Access Control** | Simple permission model, easy to implement | Not fine-grained (field-level permissions not possible) |
| **Row-Level Filtering in get_queryset()** | Prevents accidental data leaks | Must remember on every ViewSet (no automatic protection) |
| **Component-Level State** | Simple, no Redux overhead | Prop drilling for shared state, harder to scale |
| **localStorage for Token** | Survives page refresh, simple | XSS vulnerability (token exposed to JavaScript) |
| **Frontend Services Pattern** | Centralized API definitions | Must remember to use service layer, not axios directly |
| **Excel Import System** | Flexible, handles variations | Complex logic in backend (ColumnMapper, DataCleaner) |
| **M2M through PFEStudent** | Explicit model, can add fields (like status) | More queries than implicit M2M |
| **JSON Field for Matieres** | Flexible schema, unnested data | Not queryable/sortable in database (must fetch & filter in Python) |

### 5.2 Best Practices Implemented

✅ **Backend Best Practices:**
- RESTful API design (proper HTTP methods & status codes)
- Permission & authentication on every view
- QuerySet filtering for data access control
- Atomic transactions for data consistency
- DRY: Serializers for data validation
- Logging for import operations
- Docstrings on models & methods
- Protected foreign keys (PROTECT, not CASCADE)
- Validation in models & serializers

✅ **Frontend Best Practices:**
- Component composition & reusability
- Separation of concerns (pages vs components vs services)
- Centralized API layer (services/index.js)
- Error boundaries for crash safety
- Loading states during async operations
- User feedback (success/error messages)
- Responsive design with flexbox
- Access token refresh on 401
- Uncontrolled components for dropdowns (less memory overhead)

✅ **Database Best Practices:**
- Primary keys for all tables
- Foreign key constraints
- Unique constraints on identifiers (cin, email, matricule, code)
- Proper field types (DateField vs CharField)
- Indexes on frequently queried fields (implicit on ForeignKey)
- Data integrity via ORM validation

### 5.3 Areas for Improvement

⚠️ **Current Limitations:**
1. **XSS Risk**: Token in localStorage (consider httpOnly cookies)
2. **No Pagination**: Dashboard loads all students (could be 1000+)
3. **No Caching**: Every page refresh fetches fresh data
4. **No Rate Limiting**: Backend has no request throttling
5. **No API Versioning**: If schema changes, all clients break
6. **Limited Error Messages**: Generic "Erreur de chargement"
7. **No Soft Deletes**: Deleted records are gone forever
8. **No Audit Trail**: Who changed what, when?
9. **Token Expiration**: Tokens don't expire (security risk)
10. **No Field-Level Permissions**: Can't hide fields from certain roles

---

## 6. POTENTIAL INTERVIEW QUESTIONS & ANSWERS

### **Q1: How does authentication work in this system?**

**Answer:**
"We use token-based authentication with Django REST Framework. Here's the flow:

1. **Login**: User submits credentials to `/api-token-auth/`
2. **Token Generation**: Backend validates credentials, creates/retrieves a Token
3. **Token Storage**: Frontend stores token in localStorage
4. **Request Authorization**: Every subsequent request includes `Authorization: Token {key}` header
5. **Backend Validation**: TokenAuthentication middleware validates token on each request
6. **Role Assignment**: Backend returns user role (admin, chef_departement, enseignant)

**Why token-based?**
- Stateless: No server-side session storage needed
- Scalable: Works with horizontal scaling/load balancers
- REST-friendly: No cookies required
- Mobile-friendly: Works with mobile apps

**Security considerations:**
- Token stored in localStorage (XSS risk) - should use httpOnly cookies in production
- Tokens don't expire currently - should implement token refresh/expiration
- Passwords sent over HTTPS (implied) - must enforce in production"

---

### **Q2: Explain the role-based access control (RBAC) system.**

**Answer:**
"We have 3 main roles implemented:

| Role | Access Level |
|------|--------------|
| admin | Full access to all data, all operations |
| chef_departement | Limited to their own department + subdepartment data |
| enseignant | View own profile, assigned courses/PFEs |

**Implementation:**
```python
def get_queryset(self):
    user = self.request.user
    if user.is_superuser:
        return Model.objects.all()  # Full access
    
    enseignant = user.enseignant
    if enseignant.role == 'admin':
        return Model.objects.all()  # Full access
    elif enseignant.role == 'chef_departement':
        return Model.objects.filter(departement=enseignant.departement)
    # Default: No access
    return Model.objects.none()
```

**How it's enforced:**
- Every ViewSet overrides `get_queryset()` to filter by role
- Permissions like `IsAdminOrChefDepartement` block unauthorized access
- FK constraints prevent 'leaking' data from other departments

**Limitation:** This is coarse-grained (row-level), not field-level. A chef_departement can see ALL fields of their department (can't hide sensitive fields)."

---

### **Q3: How does the PFE (project) management system prevent overloading supervisors?**

**Answer:**
"The system implements a **load balancing mechanism** with ceilings:

1. **Global Settings** (ParametresPfe):
   - `plafond_groupes = 5` (default) - max PFE groups per supervisor
   - Stored in database, can be updated by admin

2. **Individual Limits** (Enseignant model):
   - `plafond_pfe`: Optional individual limit per teacher
   - If set, overrides global limit
   - `plafond_enseignement`: Separate limit for teaching hours

3. **Validation Logic**:
   - When creating a PFE, system should check:
     ```python
     current_groups = PFE.objects.filter(encadrant=teacher).count()
     if current_groups >= teacher.plafond_pfe or plafond_groupes:
         raise ValidationError('Supervisor at capacity')
     ```
   - Currently this validation might not be enforced in the API

4. **Database Constraint**:
   - M2M through PFEStudent enforces 1-2 students per PFE
   - `clean()` method on PFE model validates this

**Current Status:** The parameters are configured but the actual enforcement logic should be verified in the API. This is a business rule that should be validated on creation."

---

### **Q4: Walk me through how the data flows from the database to the dashboard.**

**Answer:**
"Here's the complete flow:

1. **Frontend Init**:
   - Dashboard.jsx mounts
   - useEffect triggers: `axios.get('dashboard/stats/')`

2. **API Request**:
   - Axios sends GET to `/api/dashboard/stats/`
   - Adds token to Authorization header

3. **Backend Route**:
   - URL router matches '/api/dashboard/stats/'
   - Calls custom action in PFEViewSet or separate view

4. **Data Aggregation**:
   ```python
   # Backend calculates:
   - Count of all PFEs: Etudiant.objects.count()
   - Count with soumis: PFE.objects.filter(...).count()
   - Soutenances validées: Soutenance.objects.filter(resultat_technique='Validé').count()
   - By department: Soutenance.objects.values('pfe__specialite__licence__departement').annotate(count=Count('id'))
   - By gender: Soutenance.objects.filter(etudiants__genre='F').count()
   - By location: PFE.objects.values('lieu_stage').annotate(count=Count('id'))
   ```

5. **JSON Response**:
   ```json
   {
     \"pourcentage_depot\": 85.5,
     \"etudiants_ayant_depose\": 153,
     \"taux_reussite_technique\": 78.2,
     \"stats_departements\": [
       {\"departement\": \"Informatique\", \"taux_reussite\": 85.5, \"total\": 45}
     ]
   }
   ```

6. **Frontend Display**:
   - React setState(stats)
   - Recharts components render:
     - PieChart for solo/paired distribution
     - BarChart for success rates by department
     - KPI cards with percentages

7. **Rendering**:
   - ResponsiveContainer auto-sizes charts
   - CSS styles colors & spacing
   - Chart updates if data changes

**Performance Note:** All data aggregation happens on the backend (good). Dashboard fetches once on load (no real-time updates)."

---

### **Q5: How does the intelligent Excel import handle variations in column names?**

**Answer:**
"The system uses an **intelligent column mapping algorithm**:

1. **File Detection**:
   ```python
   filename = file_obj.name.lower()
   if filename.endswith('.csv'):
       headers, rows, errors = read_csv_file(file_obj)
   else:
       headers, rows, errors = read_excel_file(file_obj)
   ```

2. **Column Mapping** (ColumnMapper class):
   - Extracts headers from file: [\"Nom\", \"Email\", \"Grade\", ...]
   - Maps to model fields: {'nom': 'nom', 'email': 'email', 'grade': 'grade'}
   - **Fuzzy matching** for variations:
     - \"nom\" → \"nom\"
     - \"Name\" → \"nom\" (English to French)
     - \"nom_fr\" → \"nom\" (explicit suffix)
     - \"daterecrutement\" → \"dateRecrutement\" (case-insensitive)

3. **Data Cleaning** (DataCleaner class):
   - Phone numbers: \"06 1234 5678\" → \"0612345678\"
   - Dates: \"15/01/2020\" → \"2020-01-15\"
   - Strings: \"  John  \" → \"John\"
   - Case correction: \"daterecrutement\" → \"dateRecrutement\"

4. **Validation**:
   ```python
   required_fields = ['matricule', 'nom', 'prenom', 'email', 'cin', ...]
   if missing_fields:
       reporter.add_error(row_num, f\"Missing: {missing_fields}\")
       continue
   ```

5. **Result Reporting**:
   - Detailed ImportReporter tracks:
     - ✅ Successfully imported rows
     - ❌ Errors (with line numbers & reasons)
     - ⚠️ Warnings (\"Record already exists\")

6. **Atomic Transaction**:
   ```python
   with transaction.atomic():
       # All imports happen or none
       # If error on row 50, all previous 49 are rolled back
   ```

**Example Variation Handling:**
```
CSV Column: \"Nom Complet\" + \"Prénom\" separate
Excel Column: \"Nom_Fr\"
Result: All mapped to 'nom' field intelligently
```

**Benefits:**
- Users don't need perfectly formatted Excel files
- Reduces manual data cleanup before import
- Error messages point to exact line numbers
- All-or-nothing import prevents partial data"

---

### **Q6: What happens when a teacher is assigned to multiple courses?**

**Answer:**
"Teachers can be assigned to multiple courses through the **UEElement → Enseignant** relationship:

1. **One Teacher, Many Courses**:
   - Enseignant model has FK to UEElement via `enseignant_id`
   - One teacher can teach many UEElement instances
   - Example: \"Dr. Dupont\" teaches:
     - Web Development (UEElement 1)
     - Database Design (UEElement 2)
     - Algorithm (UEElement 3)

2. **AffectationDetail Model**:
   - Further granulation: assigns teacher to specific type
   - Example: Dr. Dupont teaches:
     - Web Development COURS (30 hours)
     - Web Development TD (20 hours)
   - Each stored as separate AffectationDetail

3. **Workload Tracking**:
   ```python
   total_hours = UEElement.objects.filter(enseignant=teacher).aggregate(
       total=Sum('total_heures')  # Calls total_heures() method
   )
   ```

4. **Capacity Limits**:
   ```python
   if total_hours > teacher.plafond_enseignement:
       raise ValidationError('Teacher at teaching capacity')
   ```

5. **In the UI** (GestionAffectationsAcademiques):
   - Kanban board shows assignments
   - Drag-drop interface to reassign
   - Validates plafond on drop

6. **Protection on Delete**:
   ```python
   enseignant = models.ForeignKey(..., on_delete=models.PROTECT)
   # Can't delete teacher if assigned to courses
   ```

**Edge Cases:**
- If teacher transferred: Update FK on all UEElements
- If teacher leaves: Must reassign all courses first
- Overlapping semesters: System doesn't prevent (business rule)

**Improvement:** Could add conflict detection (can't teach same course twice simultaneously)"

---

### **Q7: Describe the relationship between PFE, Soutenance, and Students.**

**Answer:**
"There's a **one-to-many-to-many relationship** structure:

**Data Model:**

```
PFE (Project/Internship)
├── 1 Encadrant (Supervisor)
├── 1-2 Etudiants (Students, via PFEStudent)
├── 1-M Soutenances
│   ├── 1 Encadrant (Supervisor)
│   ├── 1 Rapporteur (Reviewer - different from encadrant)
│   ├── M Etudiants (can be different from PFE students)
│   ├── Type: 'technique' or 'finale'
│   ├── Results: resultat_technique, resultat_finale
│   └── Deposits: depot_electronique, depot_papier
```

**Example Scenario:**

```
PFE 42: \"AI Chatbot Project\"
├── Students: Jean (id=10) & Marie (id=11)
├── Supervisor: Dr. Dupont (matricule=E05)
└── Soutenances:
    ├── Soutenance 100 (Technical Defense)
    │   ├── Date: 2025-03-15 09:00
    │   ├── Students: Jean, Marie (same as PFE)
    │   ├── Encadrant: Dr. Dupont
    │   ├── Rapporteur: Pr. Martin (matricule=E02)
    │   ├── Result: 'Validée'
    │   └── Deposits: electronic ✓, paper ✓
    │
    └── Soutenance 101 (Final Defense)
        ├── Date: 2025-05-10 10:00
        ├── Students: Jean, Marie
        ├── Encadrant: Dr. Dupont
        ├── Rapporteur: Pr. Durand (matricule=E08)
        ├── Result: 'Validée'
        └── Deposits: electronic ✓, paper ✓
```

**Key Constraints:**
1. PFE must have 1-2 students (validated in clean() method)
2. Soutenance requires:
   - Encadrant (PROTECT FK - can't delete)
   - Rapporteur (PROTECT FK - can't delete)
   - Type (technique/finale)
3. PFEStudent is OneToOne: Student assigned to ONE PFE max

**Rapporteur Selection Rules** (from code comments):
- Cannot be a ContratDoctorant (PhD candidate)
- Cannot be a ContratDocteur (post-doc)
- Usually external reviewer for objectivity

**Dashboard Impact:**
```python
# Aggregated metrics:
- % students with PFE: COUNT(PFEStudent) / COUNT(Etudiant)
- % technical defense passed: Count(Soutenance type='technique' resultat='Validée') 
- % final defense passed: Count(Soutenance type='finale' resultat='Validée')
- Success by gender/department: Filter by Etudiant.genre, Licence.departement
```

**Workflow:**
1. Admin creates PFE(s) for students
2. Students work on projects (2-4 months)
3. Technical defense scheduled (internal review)
4. If technical passed → Final defense scheduled
5. Final defense is official grading
6. Deposits (electronic + paper) tracked for records"

---

### **Q8: What security vulnerabilities exist, and how would you address them?**

**Answer:**
"Here are the main security concerns I've identified:

| Vulnerability | Current State | Mitigation |
|---------------|---------------|-----------|
| **XSS Attack** | Token in localStorage | Use httpOnly cookies + CSRF tokens |
| **CSRF** | Not explicitly protected on SPA | Add CSRF token to non-GET requests |
| **Token Expiration** | No expiration | Implement JWT with exp claim, add refresh tokens |
| **SQL Injection** | Protected by ORM | Django ORM parameterizes queries ✓ |
| **Password Storage** | Django's default hashing | Uses PBKDF2 ✓ |
| **Sensitive Data Exposure** | API returns all fields | Implement field-level permissions |
| **Insecure Transport** | No HTTPS enforcement | Enforce HTTPS in production, set SECURE_SSL_REDIRECT |
| **Weak Password Validation** | Default Django rules | Add custom validators (length, complexity) |
| **Debug Mode in Production** | DEBUG=True if not .env | Never deploy with DEBUG=True |
| **Secret Key Hardcoded** | Uses .env ✓ | Rotate SECRET_KEY periodically |

**Recommendations:**

1. **Switch from localStorage to cookies:**
   ```python
   # Backend: Set httpOnly, Secure, SameSite cookies
   response.set_cookie('token', token.key, httponly=True, secure=True, samesite='Lax')
   ```

2. **Implement JWT tokens with expiration:**
   ```python
   # Use djangorestframework-simplejwt
   # Access token expires in 5 min
   # Refresh token expires in 24 hours
   ```

3. **Add CSRF protection:**
   ```javascript
   // Frontend: Get CSRF token from cookie
   const csrfToken = getCookie('csrftoken');
   axios.defaults.headers.common['X-CSRFToken'] = csrfToken;
   ```

4. **Rate limiting:**
   ```python
   # Use django-ratelimit on login endpoint
   @ratelimit(key='ip', rate='5/m')
   def login():
       ...
   ```

5. **Input validation:**
   ```python
   # Already done via serializers ✓
   ```

6. **Audit logging:**
   ```python
   # Log who accessed what, when
   class AuditLog(models.Model):
       user = FK(User)
       action = CharField()  # CREATE, UPDATE, DELETE
       model = CharField()
       object_id = IntegerField()
       timestamp = DateTimeField(auto_now_add=True)
   ```"

---

### **Q9: How does the system handle file uploads (for department photos, PFE documents)?**

**Answer:**
"File uploads are handled through Django's FileField:

**Model Level:**
```python
# Departement model
photo = models.FileField(upload_to='departements_photos/', blank=True, null=True)

# PFE model
convention_file = models.FileField(upload_to='conventions/', null=True, blank=True)
lettre_affectation_file = models.FileField(upload_to='lettres_affectation/', null=True)
```

**Configuration** (settings.py):
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**Directory Structure:**
```
project/
└─ media/
   ├─ departements_photos/
   │  ├─ photo_1.jpg
   │  └─ photo_2.png
   ├─ conventions/
   │  └─ convention_PFE_42.pdf
   └─ lettres_affectation/
      └─ lettre_E001.pdf
```

**Upload Process:**

1. **Frontend**:
   ```javascript
   const formData = new FormData();
   formData.append('photo', fileInput.files[0]);
   axios.post('/api/departements/', formData);
   ```

2. **Backend Parser**:
   ```python
   class DepartementViewSet(viewsets.ModelViewSet):
       parser_classes = [MultiPartParser, FormParser, JSONParser]
   ```
   - MultiPartParser: Handles file uploads
   - FormParser: Handles form data
   - JSONParser: Handles JSON (default)

3. **Serializer Validation**:
   ```python
   photo = serializers.FileField(required=False)
   # Can add custom validation:
   def validate_photo(self, value):
       if value.size > 5 * 1024 * 1024:  # 5MB
           raise ValidationError('File too large')
       return value
   ```

4. **Storage**:
   ```python
   # Django saves to media/departements_photos/{uuid}.{ext}
   dept.photo.save('photo.jpg', file_content)
   ```

5. **Access**:
   ```
   GET /media/departements_photos/photo_1.jpg
   ```

**Security Concerns:**

⚠️ **Current Issues:**
- No file type validation (could upload executable)
- No size limits enforced
- Files publicly accessible (no auth check)

✅ **Improvements:**
```python
import mimetypes

def validate_photo(self, value):
    # Check file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if value.content_type not in allowed_types:
        raise ValidationError('Only JPG, PNG, GIF allowed')
    
    # Check file size
    if value.size > 5 * 1024 * 1024:  # 5MB
        raise ValidationError('File too large (max 5MB)')
    
    return value

# Serve private files with auth:
# Instead of /media/ URL, use authenticated view
```

**Production Consideration:**
- Currently files stored locally (scales poorly)
- Should use S3/Azure Blob Storage for cloud deployment"

---

### **Q10: How would you add a feature to track teaching load over semesters?**

**Answer:**
"Here's a complete implementation plan:

**1. New Model to Track Hours:**
```python
# In enseignants/models.py
class EnseignantCharge(models.Model):
    enseignant = FK(Enseignant)
    semestre = CharField(choices=[('S1','S1'), ('S2','S2'), ...])
    annee = CharField(choices=[('L1','L1'), ('L2','L2'), ('L3','L3')])
    heures_cours = DecimalField(default=0)
    heures_td = DecimalField(default=0)
    heures_tp = DecimalField(default=0)
    heures_ci = DecimalField(default=0)
    date_updated = DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('enseignant', 'semestre', 'annee')
    
    @property
    def total_heures(self):
        return self.heures_cours + self.heures_td + self.heures_tp + self.heures_ci
```

**2. Update UEElement Assignment Logic:**
```python
# When UEElement is saved with enseignant:
def save(self, *args, **kwargs):
    super().save(*args, **kwargs)
    
    if self.enseignant:
        # Extract semestre & annee from related Module
        semestre = self.module.semestre
        annee = self.module.annee
        
        # Update charge record
        charge, created = EnseignantCharge.objects.get_or_create(
            enseignant=self.enseignant,
            semestre=semestre,
            annee=annee
        )
        
        # Recalculate totals
        charge.heures_cours = self.vh_c * self.sections
        charge.heures_td = self.vh_td * self.groupes_td
        charge.heures_tp = self.vh_tp * self.sous_groupes_tp
        charge.heures_ci = self.vh_ci * self.sections
        charge.save()
```

**3. New API Endpoint:**
```python
# In enseignants/views.py
@action(detail=True, methods=['get'])
def charge_semestrielle(self, request, matricule=None):
    \"\"\"Get teaching load by semester\"\"\"
    enseignant = self.get_object()
    charges = EnseignantCharge.objects.filter(enseignant=enseignant)
    
    return Response({
        'matricule': matricule,
        'charges': [
            {
                'semestre': c.semestre,
                'annee': c.annee,
                'heures_cours': c.heures_cours,
                'heures_td': c.heures_td,
                'heures_tp': c.heures_tp,
                'total': c.total_heures,
                'departement_limit': enseignant.plafond_enseignement
            }
            for c in charges
        ]
    })

# Endpoint: GET /api/enseignants/{matricule}/charge_semestrielle/
```

**4. Frontend Display:**
```javascript
// New page: GestionChargesEnseignants.jsx
useEffect(() => {
    axios.get(\`/enseignants/\${matricule}/charge_semestrielle/\`)
        .then(res => {
            // Display as table
            // Chart showing hours vs capacity
        })
}, [matricule])

// Table: Semestre | Année | Cours | TD | TP | CI | Total | % of limit
```

**5. Validation Enhancement:**
```python
# In UEElementViewSet.create():
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    ue_element = serializer.save()
    
    # Check workload
    if ue_element.enseignant:
        charge = EnseignantCharge.objects.get_or_create(...)[0]
        if charge.total_heures > ue_element.enseignant.plafond_enseignement:
            # Raise warning (not error - allow override by admin)
            return Response({
                'warning': f'Teaching load ({charge.total_heures}h) exceeds limit ({ue_element.enseignant.plafond_enseignement}h)',
                'data': serializer.data
            }, status=201)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**6. Migration:**
```bash
python manage.py makemigrations enseignants
python manage.py migrate
```

**Benefits:**
- Tracks actual teaching hours vs declared plafond
- Prevents overloading (with warnings)
- Useful for salary/compensation calculations
- Semester-level granularity
- Historical tracking (never updated, only replaced)"

---

## Summary - Key Takeaways

### **Architecture:**
- **REST API + SPA**: Clean separation of frontend & backend
- **Token Auth**: Stateless, scalable authentication
- **Role-Based Access**: 3 user levels (admin, chef_dept, enseignant)

### **Backend (Django):**
- **4 Apps**: Academique, Enseignants, Etudiants, PFEs
- **Rich Models**: Complex relationships (ForeignKey, M2M, inheritance)
- **Smart Import**: Flexible Excel/CSV import with error handling
- **ViewSets**: Automatic CRUD + custom @actions

### **Frontend (React):**
- **Component-Based**: Reusable, composable UI
- **Centralized API**: services/index.js for all requests
- **Token Persistence**: localStorage survives page reload
- **Chart Integration**: Recharts for dashboard visualization

### **Data Security:**
- Row-level filtering (department-based isolation)
- Protected ForeignKeys (PROTECT) prevent orphaned data
- Atomic transactions for import integrity

---

**Last Updated:** May 24, 2026
