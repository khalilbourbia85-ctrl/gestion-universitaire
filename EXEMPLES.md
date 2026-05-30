# 💡 Exemples d'utilisation de la nouvelle architecture

Ce fichier montre comment utiliser les nouveaux services, composants et utilitaires.

---

## 🎨 Frontend Examples

### 1. Utiliser les Services API

#### ❌ AVANT (ne plus faire)
```javascript
import axios from './utils/axiosConfig';

useEffect(() => {
  axios.get('/etudiants/')
    .then(res => setStudents(res.data))
    .catch(err => console.error(err));
}, []);
```

#### ✅ APRÈS (utiliser les services)
```javascript
import { etudiants } from '../services';

useEffect(() => {
  etudiants.getEtudiants()
    .then(data => setStudents(data))
    .catch(error => console.error('Erreur:', error.message));
}, []);
```

### 2. Créer une nouvelle entité

```javascript
import { academique } from '../services';

const handleCreateDepartement = async (formData) => {
  try {
    const newDept = await academique.createDepartement(formData);
    setDepartements([...departements, newDept]);
    showSuccess('Département créé avec succès');
  } catch (error) {
    showError('Erreur lors de la création');
  }
};
```

### 3. Importer les composants correctement

#### ❌ AVANT
```javascript
import DepartementForm from '../../../components/DepartementForm';
import DepartementTable from '../../../components/DepartementTable';
import LicenceForm from '../../../components/LicenceForm';
import LicenceTable from '../../../components/LicenceTable';
```

#### ✅ APRÈS
```javascript
import { DepartementForm, LicenceForm } from '../components/forms';
import { DepartementTable, LicenceTable } from '../components/tables';
```

### 4. Valider un formulaire

```javascript
import { validateEmail, validatePhone, validateCIN } from '../utils/validators';

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!validateEmail(email)) {
    setError('Email invalide');
    return;
  }
  
  if (!validatePhone(phone)) {
    setError('Numéro de téléphone invalide');
    return;
  }
  
  if (!validateCIN(cin)) {
    setError('CIN invalide (8 chiffres)');
    return;
  }
  
  // Soumettre le formulaire
};
```

### 5. Formater des données

```javascript
import { 
  formatDate, 
  formatPhone, 
  formatCurrency,
  truncateText,
  toTitleCase 
} from '../utils/formatters';

// Affichage
<td>{formatDate(student.dateNaissance, 'dd/MM/yyyy')}</td>
<td>{formatPhone(student.telephone)}</td>
<td>{formatCurrency(student.frais)}</td>
<td title={student.bio}>{truncateText(student.bio, 50)}</td>
<td>{toTitleCase(student.nom)}</td>
```

### 6. Utiliser les constants

```javascript
import { ACADEMIC_YEARS, PFE_STATUS, USER_ROLES } from '../constants';

// Select des années académiques
<select>
  {ACADEMIC_YEARS.map(year => (
    <option key={year} value={year}>{year}</option>
  ))}
</select>

// Afficher statut PFE
<span>{PFE_STATUS[pfe.status]}</span>

// Vérifier le rôle utilisateur
if (role === USER_ROLES.ADMIN) {
  // Afficher controls admin
}
```

### 7. Page complète avec la nouvelle architecture

```javascript
// pages/GestionDepartements.jsx
import { useState, useEffect } from 'react';
import { academique } from '../services';
import { DepartementForm, DepartementTable } from '../components/forms';
import { truncateText, formatDate } from '../utils/formatters';
import { validateRequired } from '../utils/validators';

export default function GestionDepartements() {
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  // Load data
  useEffect(() => {
    loadDepartements();
  }, []);

  const loadDepartements = async () => {
    try {
      setLoading(true);
      const data = await academique.getDepartements();
      setDepartements(data);
    } catch (err) {
      setError('Erreur lors du chargement des départements');
    } finally {
      setLoading(false);
    }
  };

  // Create
  const handleCreate = async (data) => {
    if (!validateRequired(data.name)) {
      setError('Le nom est requis');
      return;
    }
    
    try {
      const newDept = await academique.createDepartement(data);
      setDepartements([...departements, newDept]);
      setFormData({});
      setError(null);
    } catch (err) {
      setError('Erreur lors de la création');
    }
  };

  // Update
  const handleUpdate = async (id, data) => {
    try {
      const updated = await academique.updateDepartement(id, data);
      setDepartements(departements.map(d => d.id === id ? updated : d));
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr ?')) {
      try {
        await academique.deleteDepartement(id);
        setDepartements(departements.filter(d => d.id !== id));
        setError(null);
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div>
      <h2>Gestion des Départements</h2>
      
      {error && <div className="error">{error}</div>}
      
      <DepartementForm 
        onSubmit={handleCreate}
        loading={loading}
      />
      
      <DepartementTable
        data={departements}
        loading={loading}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

---

## 🐍 Backend Examples

### 1. Créer un Service pour logique métier

```python
# apps/academique/services/department_service.py

from ..models import Departement
from apps.utils.email_utils import send_email

class DepartementService:
    """Service pour gestion des départements"""
    
    def create_departement(self, data):
        """Créer un département avec validations métier"""
        # Validation
        if self.departement_exists(data.get('name')):
            raise ValueError("Ce département existe déjà")
        
        # Logique métier
        departement = Departement.objects.create(**data)
        
        # Effets secondaires
        self.send_notification(departement)
        
        return departement
    
    def update_departement(self, id, data):
        """Mettre à jour un département"""
        departement = Departement.objects.get(id=id)
        
        # Vérifier les modifications importantes
        if data.get('name') != departement.name:
            self.log_change(departement, 'name', departement.name, data['name'])
        
        for key, value in data.items():
            setattr(departement, key, value)
        
        departement.save()
        return departement
    
    def delete_departement(self, id):
        """Supprimer un département avec validations"""
        departement = Departement.objects.get(id=id)
        
        # Validation: vérifier qu'il n'a pas de licences
        if departement.licence_set.exists():
            raise ValueError("Impossible de supprimer: ce département a des licences")
        
        departement.delete()
    
    def get_departement_stats(self, id):
        """Obtenir statistiques du département"""
        departement = Departement.objects.get(id=id)
        
        stats = {
            'licences_count': departement.licence_set.count(),
            'enseignants_count': departement.enseignant_set.count(),
            'etudiants_count': sum(l.etudiant_set.count() for l in departement.licence_set.all()),
        }
        
        return stats
    
    def departement_exists(self, name):
        return Departement.objects.filter(name=name).exists()
    
    def send_notification(self, departement):
        """Envoyer notification création"""
        subject = f"Nouveau département: {departement.name}"
        message = f"Le département {departement.name} a été créé"
        send_email(subject, message)
    
    def log_change(self, obj, field, old_value, new_value):
        """Logger les changements"""
        print(f"[LOG] {obj.__class__.__name__}.{field}: {old_value} -> {new_value}")
```

### 2. Créer un ViewSet utilisant le Service

```python
# apps/academique/views.py (ou controllers/)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Departement
from ..serializers import DepartementSerializer
from .services.department_service import DepartementService

class DepartementViewSet(viewsets.ModelViewSet):
    """API endpoints pour Départements"""
    
    serializer_class = DepartementSerializer
    queryset = Departement.objects.all()
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service = DepartementService()
    
    def perform_create(self, serializer):
        """Créer via le service"""
        self.service.create_departement(serializer.validated_data)
    
    def perform_update(self, serializer):
        """Mettre à jour via le service"""
        self.service.update_departement(
            self.kwargs['pk'],
            serializer.validated_data
        )
    
    def perform_destroy(self, instance):
        """Supprimer via le service"""
        self.service.delete_departement(instance.id)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Endpoint personnalisé: /departements/{id}/statistics/"""
        try:
            stats = self.service.get_departement_stats(pk)
            return Response(stats)
        except Departement.DoesNotExist:
            return Response(
                {'error': 'Département non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
```

### 3. Ajouter aux routes

```python
# apps/academique/routes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..controllers import DepartementViewSet

router = DefaultRouter()
router.register(r'departements', DepartementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### 4. Enregistrer dans settings.py

```python
# gestion_departements/urls.py

urlpatterns = [
    # ...
    path('api/academique/', include('apps.academique.routes.urls')),
    path('api/etudiants/', include('apps.etudiants.routes.urls')),
    path('api/enseignants/', include('apps.enseignants.routes.urls')),
    path('api/pfes/', include('apps.pfes.routes.urls')),
]
```

---

## 🔄 Workflow complet: Créer une nouvelle fonctionnalité

### Scénario: Ajouter "Gestion des Bourses"

#### BACKEND

**Étape 1: Créer le modèle**
```python
# apps/academique/models.py
class Bourse(models.Model):
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Étape 2: Migration**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Étape 3: Créer le Serializer**
```python
# apps/academique/serializers/bourse_serializer.py
from rest_framework import serializers
from ..models import Bourse

class BourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bourse
        fields = '__all__'
```

**Étape 4: Créer le Service**
```python
# apps/academique/services/bourse_service.py
class BourseService:
    def create_bourse(self, data):
        # Logique métier
        return Bourse.objects.create(**data)
```

**Étape 5: Créer le ViewSet**
```python
# apps/academique/views.py
class BourseViewSet(viewsets.ModelViewSet):
    serializer_class = BourseSerializer
    queryset = Bourse.objects.all()
    service = BourseService()
    
    def perform_create(self, serializer):
        self.service.create_bourse(serializer.validated_data)
```

**Étape 6: Ajouter aux routes**
```python
# apps/academique/routes/urls.py
router.register(r'bourses', BourseViewSet)
```

#### FRONTEND

**Étape 1: Ajouter au service API**
```javascript
// src/services/index.js
export const academique = {
  // ... existant
  
  // Bourses
  getBourses: () => axios.get('/academique/bourses/'),
  getBourse: (id) => axios.get(`/academique/bourses/${id}/`),
  createBourse: (data) => axios.post('/academique/bourses/', data),
  updateBourse: (id, data) => axios.put(`/academique/bourses/${id}/`, data),
  deleteBourse: (id) => axios.delete(`/academique/bourses/${id}/`),
};
```

**Étape 2: Créer le formulaire**
```javascript
// src/components/forms/BourseForm.jsx
export default function BourseForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs */}
    </form>
  );
}
```

**Étape 3: Créer le tableau**
```javascript
// src/components/tables/BourseTable.jsx
export default function BourseTable({ data, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Montant</th>
          <th>Étudiant</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(bourse => (
          <tr key={bourse.id}>
            <td>{bourse.name}</td>
            <td>{formatCurrency(bourse.amount)}</td>
            <td>{bourse.etudiant.name}</td>
            <td>
              <button onClick={() => onEdit(bourse)}>✏️</button>
              <button onClick={() => onDelete(bourse.id)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Étape 4: Créer la page**
```javascript
// src/pages/GestionBourses.jsx
import { useState, useEffect } from 'react';
import { academique } from '../services';
import { BourseForm } from '../components/forms';
import { BourseTable } from '../components/tables';

export default function GestionBourses() {
  const [bourses, setBourses] = useState([]);
  
  useEffect(() => {
    loadBourses();
  }, []);
  
  const loadBourses = async () => {
    const data = await academique.getBourses();
    setBourses(data);
  };
  
  const handleCreate = async (data) => {
    const newBourse = await academique.createBourse(data);
    setBourses([...bourses, newBourse]);
  };
  
  return (
    <div>
      <h2>Gestion des Bourses</h2>
      <BourseForm onSubmit={handleCreate} />
      <BourseTable data={bourses} />
    </div>
  );
}
```

**Étape 5: Ajouter aux routes**
```javascript
// src/routes/index.js
import GestionBourses from '../pages/GestionBourses';

export const protectedRoutes = [
  // ... existant
  {
    path: '/bourses',
    component: GestionBourses,
    name: 'Gestion Bourses',
    icon: '💰',
    parent: 'Gestion Académique',
  },
];
```

#### RÉSULTAT

✅ La nouvelle page "Gestion des Bourses" est automatiquement:
- Disponible dans la navigation
- Accessible via `/bourses`
- Complètement fonctionnelle (CRUD)
- Intégrée à l'API backend

---

## 🎯 Bonnes pratiques

✅ **À FAIRE:**
- Utiliser les services pour tous les appels API
- Créer des services pour la logique métier
- Valider les données côté frontend ET backend
- Utiliser les formatters pour l'affichage
- Organiser les composants par type

❌ **À NE PAS FAIRE:**
- Appeler axios directement depuis les composants
- Mélanger logique métier et présentation
- Dupliquer du code
- Importer depuis le chemin complet
- Mettre la logique métier dans les ViewSets

---

**Voilà les exemples! Bonne chance ! 🚀**
