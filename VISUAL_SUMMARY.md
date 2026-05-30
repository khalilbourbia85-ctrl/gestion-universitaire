# 📊 RÉSUMÉ VISUEL - Diagrammes et schémas rapides

**Consultez ce document pour une compréhension VISUELLE et RAPIDE de votre architecture.**

---

## 🏗️ 1. ARCHITECTURE GÉNÉRALE

```
╔════════════════════════════════════════════════════════════════════╗
║                      VOTRE APPLICATION                             ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │           FRONTEND (React + Vite)                          │  ║
║  │  localhost:5173                                            │  ║
║  │                                                             │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ Components (Tables, Forms, Charts)                  │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  │                    ↓                                        │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ Services (API calls via Axios)                      │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────┘  ║
║                          ↓ HTTP REST                              ║
║              (Authorization: Token {token})                       ║
║                          ↓                                        ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │           BACKEND (Django + DRF)                          │  ║
║  │  localhost:8000                                            │  ║
║  │                                                             │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ Router (Automatic from ViewSets)                    │  │  ║
║  │  │ GET /api/etudiants/ → EtudiantViewSet              │  │  ║
║  │  │ POST /api/etudiants/ → create()                    │  │  ║
║  │  │ PUT /api/etudiants/1/ → update()                   │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  │                    ↓                                        │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ Authentication (TokenAuthentication)                │  │  ║
║  │  │ Authorization (Permission classes)                  │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  │                    ↓                                        │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ ViewSets (Business logic + CRUD)                   │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  │                    ↓                                        │  ║
║  │  ┌──────────────────────────────────────────────────────┐  │  ║
║  │  │ ORM (Django Models)                                 │  │  ║
║  │  └──────────────────────────────────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────┘  ║
║                          ↓ SQL                                    ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │           DATABASE (PostgreSQL)                            │  ║
║  │  Normalized schema - 16+ models                            │  ║
║  │  Foreign Keys, Constraints, Indexes                        │  ║
║  └─────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🔐 2. FLUX D'AUTHENTIFICATION

```
┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: LOGIN                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USER INPUT:                                                   │
│  ┌──────────────────────────┐                                 │
│  │ Username: admin          │                                 │
│  │ Password: admin123       │                                 │
│  └──────────────────────────┘                                 │
│           ↓                                                     │
│  POST /api-token-auth/                                        │
│  Content-Type: application/json                              │
│  {"username": "admin", "password": "admin123"}               │
│           ↓                                                     │
│  SERVER VERIFICATION:                                         │
│  ✓ Username existe?                                           │
│  ✓ Password match?                                            │
│  ✓ User is_active?                                            │
│           ↓ OK                                                  │
│  GENERATE TOKEN:                                              │
│  Token = hash(user_id + timestamp + secret)                 │
│  Save to AuthToken table:                                    │
│  ┌─────────────────────────────┐                             │
│  │ user_id: 1                  │                             │
│  │ token: "abc123xyz..."       │                             │
│  │ created: 2026-05-24         │                             │
│  └─────────────────────────────┘                             │
│           ↓                                                     │
│  RESPONSE TO FRONTEND:                                        │
│  {"token": "abc123xyz..."}                                   │
│           ↓                                                     │
│  FRONTEND STORES:                                             │
│  localStorage.setItem('token', 'abc123xyz...')              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: REQUÊTE API (Chaque call)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND:                                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ GET /api/etudiants/                                    │  │
│  │ Headers: {                                              │  │
│  │   Authorization: 'Token abc123xyz...'                 │  │
│  │ }                                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓                                                     │
│  SERVER VERIFICATION:                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 1. Extract token from header                           │  │
│  │ 2. Query AuthToken table:                             │  │
│  │    SELECT * FROM auth_token                           │  │
│  │    WHERE token = 'abc123xyz...'                      │  │
│  │ 3. Found? Get associated user_id                      │  │
│  │ 4. Load user from database                            │  │
│  │ 5. Set request.user = User object                     │  │
│  │ 6. Check @permission_classes:                         │  │
│  │    @permission_classes([IsAuthenticated])             │  │
│  │    ✓ request.user is not None? YES                   │  │
│  │    ✓ request.user.is_active? YES                     │  │
│  │ 7. Permission GRANTED                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓ OK                                                   │
│  EXECUTE ENDPOINT:                                            │
│  etudiants = Etudiant.objects.all()  # or filtered           │
│  serializer = EtudiantSerializer(etudiants, many=True)       │
│  return Response(serializer.data)                            │
│           ↓                                                     │
│  RESPONSE TO FRONTEND:                                        │
│  [                                                             │
│    {"id": 1, "nom": "Dupont", "email": "..."},              │
│    {"id": 2, "nom": "Martin", "email": "..."},              │
│    ...                                                        │
│  ]                                                             │
│           ↓                                                     │
│  FRONTEND UPDATES UI:                                         │
│  setStudents(response.data)                                  │
│  render Table with new data                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: LOGOUT                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND:                                                     │
│  localStorage.removeItem('token')  // Delete token           │
│  Redirect to /login                                          │
│                                                                 │
│  BACKEND (OPTIONAL):                                           │
│  DELETE from AuthToken WHERE token = 'abc123xyz...'          │
│  (Makes old token invalid immediately)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 3. STRUCTURE DE BASE DE DONNÉES

```
┌──────────────────────────────────────────────────────────────────┐
│ NIVEAU 1: UTILISATEURS                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  User (Django)   │         │  AuthToken       │              │
│  ├──────────────────┤         ├──────────────────┤              │
│  │ id (PK)          │◄────────│ id (PK)          │              │
│  │ username (UQ)    │  1:1    │ user_id (FK)     │              │
│  │ password (hash)  │         │ token (UQ)       │              │
│  │ email            │         │ created          │              │
│  │ is_active        │         └──────────────────┘              │
│  │ is_staff         │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ NIVEAU 2: ACADÉMIQUE (Hiérarchie)                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ Departement      │         │ Licence          │              │
│  ├──────────────────┤         ├──────────────────┤              │
│  │ id (PK)          │◄────────│ id (PK)          │              │
│  │ nom (UQ)         │  1:N    │ nom              │              │
│  │ code (UQ)        │         │ departement_id   │              │
│  │ responsable      │         │ (FK → Dept)      │              │
│  │ photo            │         └──────────────────┘              │
│  └──────────────────┘                  ▲                         │
│                                        │ 1:N                     │
│                                        │                         │
│                          ┌──────────────────────┐                │
│                          │ Specialite           │                │
│                          ├──────────────────────┤                │
│                          │ id (PK)              │                │
│                          │ nom                  │                │
│                          │ licence_id (FK)      │                │
│                          └──────────────────────┘                │
│                                        ▲                         │
│                                        │ 1:N                     │
│                                        │                         │
│                          ┌──────────────────────┐                │
│                          │ Module               │                │
│                          ├──────────────────────┤                │
│                          │ id (PK)              │                │
│                          │ nom                  │                │
│                          │ specialite_id (FK)   │                │
│                          │ credits              │                │
│                          └──────────────────────┘                │
│                                        ▲                         │
│                                        │ 1:N                     │
│                                        │                         │
│                          ┌──────────────────────┐                │
│                          │ UEElement            │                │
│                          ├──────────────────────┤                │
│                          │ id (PK)              │                │
│                          │ nom                  │                │
│                          │ module_id (FK)       │                │
│                          └──────────────────────┘                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ NIVEAU 3: PERSONNES (Étudiants & Enseignants)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  1:1  ┌──────────────────┐                │
│  │ User             │◄──────│ Etudiant         │                │
│  │ (id, username)   │       │ (id, nom, ...)   │                │
│  └──────────────────┘       └──────────────────┘                │
│                                      ▲                           │
│                                      │ N:1                       │
│                                      │                           │
│                             ┌────────┴──────────┐               │
│                             │ Specialite        │               │
│                             │ (id, nom)         │               │
│                             └───────────────────┘               │
│                                                                  │
│  ┌──────────────────┐  1:1  ┌──────────────────┐                │
│  │ User             │◄──────│ Enseignant       │                │
│  │ (id, username)   │       │ (id, nom, ...)   │                │
│  └──────────────────┘       └──────────────────┘                │
│                                      ▲                           │
│                                      │ N:1                       │
│                                      │                           │
│                             ┌────────┴──────────┐               │
│                             │ Specialite        │               │
│                             │ (id, nom)         │               │
│                             └───────────────────┘               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ NIVEAU 4: PFE (Projets avec Many-to-Many)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│          ┌─────────────────┐                                     │
│          │ PFE             │                                     │
│          ├─────────────────┤                                     │
│          │ id (PK)         │                                     │
│          │ titre           │                                     │
│          │ etudiant_id (FK)◄──────────────┐                     │
│          │ superviseur_id  │              │ N:1                 │
│          │ (FK → Enseignant)              │                     │
│          │ status          │         ┌────┴─────────┐           │
│          └─────────────────┘         │ Etudiant     │           │
│                  ▲                   │ (id, nom)    │           │
│                  │                   └──────────────┘           │
│                  │ 1:N                                           │
│                  │                                               │
│          ┌──────────────────────────┐                           │
│          │ RapporteurSoutenance     │  (M2M Join Table)        │
│          ├──────────────────────────┤                           │
│          │ id (PK)                  │                           │
│          │ pfe_id (FK → PFE)        │                           │
│          │ rapporteur_id (FK)◄──────┼────────────┐              │
│          │ jury_member (Boolean)    │            │ N:1          │
│          │ date_assignment          │       ┌────┴────────────┐ │
│          └──────────────────────────┘       │ Enseignant      │ │
│                                             │ (id, nom, ...) │ │
│                                             └─────────────────┘ │
│                                                                  │
│  NOTES:                                                          │
│  • 1 PFE = 1 Étudiant (N:1 via FK)                              │
│  • 1 PFE = 1 Superviseur (N:1 via FK)                           │
│  • 1 PFE = N Rapporteurs (N:M via RapporteurSoutenance)        │
│  • RapporteurSoutenance = table intermédiaire avec données      │
│    supplémentaires (jury_member, date_assignment)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 4. FLUX COMPLET: Créer un Étudiant

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER REMPLIR FORMULAIRE                                    │
│     ┌────────────────────────────┐                             │
│     │ Nom: Dupont               │                             │
│     │ Prenom: Jean              │                             │
│     │ Email: jean@example.com   │                             │
│     │ CIN: 12345678             │                             │
│     │ [Créer]                   │                             │
│     └────────────────────────────┘                             │
│                  ↓                                               │
│  2. onClick → handleCreate()                                   │
│                  ↓                                               │
│  3. VALIDATION CLIENT (validators.js)                          │
│     ✓ Email valide?                                           │
│     ✓ CIN format correct?                                     │
│     ✓ Champs requis remplis?                                 │
│                  ↓ OK                                            │
│  4. APPEL API                                                  │
│     const response = await etudiants.create({                │
│       nom: 'Dupont',                                          │
│       prenom: 'Jean',                                         │
│       email: 'jean@example.com',                             │
│       cin: '12345678'                                        │
│     })                                                         │
│                  ↓                                               │
│     POST /api/etudiants/                                      │
│     Headers: {Authorization: 'Token abc123xyz'}              │
│     Body: {...data...}                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP REQUEST
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (Django)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  5. DJANGO REÇOIT POST /api/etudiants/                        │
│                  ↓                                               │
│  6. ROUTER DIRIGE VERS EtudiantViewSet.create()               │
│                  ↓                                               │
│  7. MIDDLEWARE AUTHENTIFICATION                               │
│     • Extract token from header                              │
│     • Lookup in AuthToken table                              │
│     • Set request.user = User object                         │
│                  ↓                                               │
│  8. PERMISSION CHECK                                          │
│     @permission_classes([IsAuthenticated])                   │
│     if not request.user:                                     │
│         raise PermissionDenied(401)                         │
│                  ↓ OK (user logged in)                         │
│  9. SERIALIZATION & VALIDATION                               │
│     serializer = EtudiantSerializer(data=request.data)       │
│     if not serializer.is_valid():                           │
│         return Response(serializer.errors, status=400)      │
│                  ↓ OK (data valid)                             │
│ 10. DATABASE SAVE                                             │
│     etudiant = serializer.save()                            │
│                                                                 │
│     ┌─────────────────────────────────────────┐              │
│     │ INSERT INTO etudiants_etudiant (        │              │
│     │   nom, prenom, email, cin, ...         │              │
│     │ ) VALUES (                              │              │
│     │   'Dupont', 'Jean', 'jean@...', '12...'│              │
│     │ )                                       │              │
│     │ RETURNING id, nom, ...                 │              │
│     └─────────────────────────────────────────┘              │
│                  ↓ New row inserted                            │
│ 11. SERIALIZED RESPONSE                                       │
│     serializer = EtudiantSerializer(etudiant)                │
│     return Response(serializer.data, status=201)            │
│                                                                 │
│     {                                                           │
│       "id": 123,                                              │
│       "nom": "Dupont",                                        │
│       "prenom": "Jean",                                       │
│       "email": "jean@example.com",                          │
│       "cin": "12345678",                                     │
│       "created_at": "2026-05-24T10:30:00Z"                 │
│     }                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP RESPONSE (201)
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 12. RESPONSE RECEIVED                                          │
│     if (response.status === 201) {                            │
│       // Success!                                             │
│       setStudents([...students, response.data])              │
│       showSuccessMessage('Étudiant créé!')                   │
│       closeForm()                                            │
│       refreshList()  // Get updated list                    │
│     }                                                          │
│                                                                 │
│ 13. UI UPDATED                                                │
│     ┌────────────────────────────┐                            │
│     │ Liste des Étudiants:       │                            │
│     │ ├─ Dupont Jean (12345678)  │ ← NEW!                    │
│     │ ├─ Martin Paul (...)       │                            │
│     │ └─ ...                     │                            │
│     └────────────────────────────┘                            │
│                                                                 │
│ 14. ALERT TO USER                                              │
│     ✓ Étudiant "Jean Dupont" créé avec succès!               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 5. RÔLES ET PERMISSIONS

```
┌─────────────────────────────────────────────────────────────────┐
│ SYSTÈME RBAC (Role-Based Access Control)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ADMIN (Administrateur)                                        │
│  ├─ Accès à TOUT                                              │
│  ├─ Peut modifier ANY Département                             │
│  ├─ Peut créer/modifier/supprimer Users                       │
│  └─ Peut voir ALL données                                     │
│                                                                 │
│  CHEF_DÉPARTEMENT (Chef Department)                           │
│  ├─ Accès ONLY à son département                              │
│  ├─ Peut voir ses licences, spécialités, modules             │
│  ├─ Peut voir ses enseignants et étudiants                   │
│  ├─ CANNOT voir autres départements                           │
│  ├─ CANNOT créer utilisateurs                                │
│  └─ CANNOT modifier système settings                          │
│                                                                 │
│  ENSEIGNANT (Teacher)                                          │
│  ├─ Accès à ses courses/modules                               │
│  ├─ Peut voir ses étudiants                                   │
│  ├─ Peut noter/évaluer ses étudiants                          │
│  ├─ CANNOT créer programmes académiques                       │
│  ├─ CANNOT gérer autres enseignants                           │
│  └─ Lecture seule pour données système                        │
│                                                                 │
│  ÉTUDIANT (Student)                                            │
│  ├─ Accès ONLY à ses propres données                          │
│  ├─ Peut voir son profil, ses cours, ses grades              │
│  ├─ Peut soumettre PFE                                        │
│  ├─ CANNOT voir autres étudiants                              │
│  ├─ CANNOT modifier aucune donnée                             │
│  └─ Lecture seule complète                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IMPLÉMENTATION EN CODE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  @permission_classes([IsAuthenticated])                        │
│  class EtudiantViewSet(viewsets.ModelViewSet):                │
│                                                                 │
│    def get_queryset(self):                                    │
│        user = self.request.user                              │
│        if user.role == 'admin':                              │
│            return Etudiant.objects.all()  # Tous              │
│        elif user.role == 'chef_departement':                 │
│            # Seulement son département                        │
│            return Etudiant.objects.filter(                   │
│                specialite__licence__departement=user.dept    │
│            )                                                   │
│        elif user.role == 'enseignant':                        │
│            # Seulement ses étudiants                          │
│            return Etudiant.objects.filter(                   │
│                uelement__enseignant=user                     │
│            ).distinct()                                       │
│        elif user.role == 'etudiant':                          │
│            # Seulement lui-même                               │
│            return Etudiant.objects.filter(                   │
│                user=user                                     │
│            )                                                   │
│                                                                 │
│    def update(self, request, *args, **kwargs):               │
│        user = self.request.user                              │
│        obj = self.get_object()                               │
│                                                                 │
│        # Admin can update anyone                              │
│        if user.role == 'admin':                              │
│            return super().update(request, *args, **kwargs)   │
│                                                                 │
│        # Student can only update himself                      │
│        if user.role == 'etudiant':                           │
│            if obj.user != user:                              │
│                raise PermissionDenied()                      │
│            # Allow update                                     │
│            return super().update(request, *args, **kwargs)   │
│                                                                 │
│        # Others: Forbidden                                     │
│        raise PermissionDenied()                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 6. ENDPOINTS API - Résumé complet

```
BASE URL: http://localhost:8000/api

AUTHENTIFICATION:
POST /api-token-auth/
  Request:  {username, password}
  Response: {token}
  Status:   200 OK / 401 Unauthorized

ACADÉM IQUE:
GET    /api/departements/           → List tous (filtered by role)
POST   /api/departements/           → Create nouveau
GET    /api/departements/{id}/      → Detail
PUT    /api/departements/{id}/      → Update
DELETE /api/departements/{id}/      → Delete

GET    /api/licences/               → List
POST   /api/licences/               → Create
PUT    /api/licences/{id}/          → Update
DELETE /api/licences/{id}/          → Delete

GET    /api/specialites/            → List
GET    /api/modules/                → List
GET    /api/ue-elements/            → List

ÉTUDIANTS:
GET    /api/etudiants/              → List (with filtering)
POST   /api/etudiants/              → Create
GET    /api/etudiants/{id}/         → Detail
PUT    /api/etudiants/{id}/         → Update
DELETE /api/etudiants/{id}/         → Delete
POST   /api/etudiants/import/       → Bulk import Excel

ENSEIGNANTS:
GET    /api/enseignants/            → List
POST   /api/enseignants/            → Create
GET    /api/enseignants/{id}/       → Detail
PUT    /api/enseignants/{id}/       → Update
DELETE /api/enseignants/{id}/       → Delete

PFE:
GET    /api/pfes/                   → List
POST   /api/pfes/                   → Create
GET    /api/pfes/{id}/              → Detail
PUT    /api/pfes/{id}/              → Update
DELETE /api/pfes/{id}/              → Delete
POST   /api/pfes/{id}/assign_rapporteurs/  → Assign reviewers
POST   /api/pfes/{id}/submit/       → Submit for defense

STATISTIQUES:
GET    /api/dashboard-stats/        → Dashboard data
  Response: {
    total_etudiants,
    total_enseignants,
    total_pfes,
    pfe_status_breakdown,
    charts_data
  }

TOUS LES ENDPOINTS NÉCESSITENT:
Headers: {
  Authorization: 'Token {token}',
  Content-Type: 'application/json'
}

CODES ERREURS:
200 OK - Succès
201 Created - Resource créée
400 Bad Request - Données invalides
401 Unauthorized - Token invalide/manquant
403 Forbidden - Pas de permissions
404 Not Found - Resource n'existe pas
500 Server Error - Erreur serveur
```

---

## 🎨 7. COMPOSANTS FRONTEND - Hiérarchie

```
App.jsx
├── React Router (5173)
│
├── Login (public route)
│   └── Form input
│
└── Layout.jsx (protected routes)
    ├── NavbarTop.jsx
    │   ├── Logo
    │   ├── User dropdown
    │   └── Logout button
    │
    ├── Sidebar.jsx
    │   ├── Navigation menu
    │   ├── Links grouped by parent
    │   └── Collapse/expand logic
    │
    └── Outlet (React Router v6)
        │
        ├── Dashboard.jsx
        │   ├── StatsCard (reusable)
        │   ├── BarChart (Recharts)
        │   ├── PieChart (Recharts)
        │   └── DataTable
        │
        ├── GestionEtudiants.jsx
        │   ├── EtudiantsTable (reusable)
        │   ├── EtudiantForm (reusable)
        │   └── Modal for create/edit
        │
        ├── GestionEnseignants.jsx
        │   ├── EnseignantsTable
        │   ├── EnseignantForm
        │   └── Modal
        │
        ├── GestionPFEs.jsx
        │   ├── PFEsTable
        │   ├── PFEForm
        │   └── AssignRapporteurs component
        │
        └── GestionSoutenances.jsx
            ├── SoutenancesTable
            ├── SoutenanceForm
            └── ScheduleCalendar

REUSABLE COMPONENTS:
├── components/tables/
│   ├── Table.jsx (generic table)
│   ├── EtudiantsTable.jsx (extends Table)
│   ├── EnseignantsTable.jsx (extends Table)
│   └── ...
│
├── components/forms/
│   ├── EtudiantForm.jsx
│   ├── DepartementForm.jsx
│   ├── PFEForm.jsx
│   └── ...
│
└── components/common/
    ├── ErrorBoundary.jsx (error handling)
    ├── ChatAssistant.jsx (AI integration)
    ├── Modal.jsx (reusable modal)
    └── LoadingSpinner.jsx
```

---

## 💾 8. RÉSUMÉ RAPIDE EN 1 PAGE

```
┌─────────────────────────────────────────────────────────────────┐
│ QU'EST-CE QUE VOTRE APP FAIT?                                  │
├─────────────────────────────────────────────────────────────────┤
│ Gère complètement les données académiques d'une université:     │
│ • Structure (Départements, Licences, Spécialités, Modules)    │
│ • Personnes (Étudiants, Enseignants)                          │
│ • PFE (Projets finals avec défenses)                          │
│ • Dashboards & statistiques                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AVEC QUELLES TECHNOLOGIES?                                      │
├─────────────────────────────────────────────────────────────────┤
│ FRONTEND: React + Vite (localhost:5173)                         │
│ BACKEND:  Django + DRF (localhost:8000)                         │
│ DATABASE: PostgreSQL (Relations normalisées)                    │
│ AUTH:     Token-based (Stateless)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COMMENT ÇA MARCHE? (5 ÉTAPES)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. USER LOGIN → Django retourne token                           │
│ 2. Frontend stocke token en localStorage                        │
│ 3. Frontend fait requêtes API avec token dans headers          │
│ 4. Backend valide token → Vérifie permissions                  │
│ 5. Backend retourne données (ou erreur)                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ POINTS FORTS À METTRE EN AVANT                                 │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Architecture claire (REST API + SPA)                         │
│ ✅ Sécurité (Token auth + RBAC)                                │
│ ✅ Scalabilité (Stateless, peut multiplier serveurs)           │
│ ✅ Maintenance (Service layer, composants réutilisables)       │
│ ✅ Complexité (M2M, transactions, fuzzy matching Excel)        │
│ ✅ Production-ready (Error handling, validation)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AMÉLIORATIONS FUTURES                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. JWT avec expiration + refresh tokens                         │
│ 2. WebSockets pour temps réel                                  │
│ 3. Tests automatisés (pytest + Jest)                           │
│ 4. Audit trail pour compliance                                 │
│ 5. Redis caching                                               │
│ 6. Microservices si scaling massif                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎓 PROCHAINES ÉTAPES

1. **Lire** tous les documents de soutenance dans le dossier racine
2. **Comprendre** chaque diagramme ci-dessus
3. **Pratiquer** votre pitch de 2-3 minutes
4. **Préparer** une démo de l'app (créer étudiant, voir liste, etc.)
5. **Anticiper** les questions avec le fichier INTERVIEW_QA.md

**Vous êtes prêt! Confiance! 🚀**
