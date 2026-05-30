# 🐍 Backend Architecture

## 📂 Structure des apps Django

```
backend/
├── apps/
│   ├── academique/
│   │   ├── controllers/        # ViewSets (logique API)
│   │   ├── routes/             # URL configuration
│   │   ├── models/             # Modèles (vides pour now)
│   │   ├── services/           # Logique métier
│   │   ├── serializers/        # Sérializers (vides pour now)
│   │   ├── migrations/         # Migrations BD
│   │   ├── views.py            # ViewSets actuels
│   │   ├── models.py           # Modèles actuels
│   │   └── serializers.py      # Serializers actuels
│   ├── etudiants/              # (même structure)
│   ├── enseignants/            # (même structure)
│   └── pfes/                   # (même structure)
├── config/                     # Configuration
├── middlewares/                # Middlewares
├── validators/                 # Validations métier
└── utils/                      # Utilitaires partagés
```

## 🚀 Démarrage

### 1. Installer les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Migrations
```bash
python manage.py migrate
```

### 3. Lancer le serveur
```bash
python manage.py runserver 8000
```

## 🏗️ Architecture des Apps

### Structure d'une App moderne

```
app/
├── controllers/
│   └── __init__.py    # Re-exporte tous les ViewSets
│
├── routes/
│   ├── __init__.py
│   └── urls.py        # Configuration URL claire
│
├── services/
│   ├── __init__.py
│   └── app_service.py # Logique métier
│
├── serializers/
│   └── __init__.py    # Re-exporte tous les Serializers
│
├── models.py          # Modèles (existants)
├── views.py           # ViewSets (existants, à garder pour compat)
├── urls.py            # URLs (existantes)
└── serializers.py     # Serializers (existants)
```

## 🔄 Flux de données

```
Client (Frontend)
    ↓
HTTP Request
    ↓
Django URL Router (routes/urls.py)
    ↓
ViewSet (controllers/)
    ↓
Service (services/)
    ↓
Model (models.py)
    ↓
Database
    ↓
Serializer (serializers/)
    ↓
HTTP Response
    ↓
Client (Frontend)
```

## 📝 Conventions

### Noms des classes
- **Models:** PascalCase - `Student`, `Teacher`, `PFE`
- **ViewSets:** PascalCase + "ViewSet" - `StudentViewSet`
- **Serializers:** PascalCase + "Serializer" - `StudentSerializer`
- **Services:** PascalCase + "Service" - `StudentService`

### Noms des fonctions
- snake_case - `get_students()`, `validate_email()`

## 🔗 Routes

Chaque app expose ses routes via `apps/app_name/routes/urls.py`:

### Exemple: routes/urls.py
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import StudentViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### Intégration dans settings.py
```python
urlpatterns = [
    path('api/academique/', include('apps.academique.routes.urls')),
    path('api/etudiants/', include('apps.etudiants.routes.urls')),
    path('api/enseignants/', include('apps.enseignants.routes.urls')),
    path('api/pfes/', include('apps.pfes.routes.urls')),
]
```

## 🎯 Services (Logique Métier)

Les services contiennent la logique métier.

### Exemple: Service de gestion des étudiants
```python
# apps/etudiants/services/student_service.py
class StudentService:
    def create_student(self, data):
        # Validations métier
        if self._student_exists(data['cin']):
            raise ValidationError("Cet étudiant existe déjà")
        
        # Logique métier
        student = Student.objects.create(**data)
        self._send_welcome_email(student)
        return student
    
    def update_student(self, student_id, data):
        student = Student.objects.get(id=student_id)
        for key, value in data.items():
            setattr(student, key, value)
        student.save()
        return student
    
    def _student_exists(self, cin):
        return Student.objects.filter(cin=cin).exists()
    
    def _send_welcome_email(self, student):
        # Envoi d'email
        pass
```

### Utilisation dans le ViewSet
```python
# apps/etudiants/views.py
from .services.student_service import StudentService

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    queryset = Student.objects.all()
    service = StudentService()
    
    def perform_create(self, serializer):
        student = self.service.create_student(serializer.validated_data)
        return student
    
    def perform_update(self, serializer):
        student = self.service.update_student(
            self.kwargs['pk'],
            serializer.validated_data
        )
        return student
```

## 🔐 Authentification

Token-based authentication:
```python
# Endpoints
POST /api-token-auth/
  { "username": "admin", "password": "password123" }
  
Response:
  { "token": "abc123...", "role": "administrateur", "user_id": 1 }
```

### Utiliser le token
```javascript
// Frontend
axios.defaults.headers.common['Authorization'] = `Token ${token}`;
```

## 📦 Dépendances principales

```
Django==5.2.12
djangorestframework==3.14.0
django-cors-headers==4.0.0
python-decouple==3.8
Pillow==10.0.0
```

## 🧪 Tests

```bash
# Lancer les tests
python manage.py test

# Tests d'une app
python manage.py test apps.etudiants

# Tests avec coverage
coverage run --source='.' manage.py test
coverage report
```

## 📊 Admin Django

Accéder à `http://localhost:8000/admin/`:
- Username: admin
- Mot de passe: admin123 (défaut, à changer)

## 🚀 Déploiement

```bash
# Créer une liste des dépendances pour prod
pip freeze > requirements.txt

# Collecter les fichiers statiques
python manage.py collectstatic

# Migrer la BD
python manage.py migrate

# Lancer avec gunicorn
gunicorn gestion_departements.wsgi
```

## 📚 Ressources

- Django: https://www.djangoproject.com
- DRF: https://www.django-rest-framework.org
- Django Models: https://docs.djangoproject.com/en/5.2/topics/db/models/
