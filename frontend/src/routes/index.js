/**
 * Application Routes Configuration
 * Central location for all application routes
 */

import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import GestionEtudiants from '../pages/GestionEtudiants';
import GestionEnseignants from '../pages/GestionEnseignants';
import GestionPFEs from '../pages/GestionPFEs';
import GestionEncadrants from '../pages/GestionEncadrants';
import GestionRapporteurs from '../pages/GestionRapporteurs';
import GestionSoutenances from '../pages/GestionSoutenances';
import GestionDepartements from '../pages/GestionDepartements';
import GestionLicences from '../pages/GestionLicences';
import GestionAffectationsAcademiques from '../pages/GestionAffectationsAcademiques';
import GestionModules from '../pages/GestionModules';
import GestionSpecialites from '../pages/GestionSpecialites';

/**
 * Public Routes - No authentication required
 */
export const publicRoutes = [
  {
    path: '/login',
    component: Login,
    name: 'Login',
  },
];

/**
 * Protected Routes - Authentication required
 */
export const protectedRoutes = [
  {
    path: '/',
    redirect: '/dashboard',
    name: 'Home',
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'Dashboard',
    icon: '📊',
  },
  {
    path: '/etudiants',
    component: GestionEtudiants,
    name: 'Gestion Étudiants',
    icon: '👥',
  },
  {
    path: '/enseignants',
    component: GestionEnseignants,
    name: 'Gestion Enseignants',
    icon: '👨‍🏫',
  },
  {
    path: '/pfes',
    component: GestionPFEs,
    name: 'Affectation PFE',
    icon: '📋',
    parent: 'Gestion PFE',
  },
  {
    path: '/encadrants',
    component: GestionEncadrants,
    name: 'Gestion Encadrants',
    icon: '🎓',
    parent: 'Gestion PFE',
  },
  {
    path: '/rapporteurs',
    component: GestionRapporteurs,
    name: 'Gestion Rapporteurs',
    icon: '📝',
    parent: 'Gestion PFE',
  },
  {
    path: '/soutenances',
    component: GestionSoutenances,
    name: 'Gestion Soutenances',
    icon: '🎤',
    parent: 'Gestion PFE',
  },
  {
    path: '/departements',
    component: GestionDepartements,
    name: 'Gestion Départements',
    icon: '🏢',
    parent: 'Gestion Académique',
  },
  {
    path: '/licences',
    component: GestionLicences,
    name: 'Gestion Licences',
    icon: '📜',
    parent: 'Gestion Académique',
  },
  {
    path: '/modules',
    component: GestionModules,
    name: 'Gestion Modules',
    icon: '📚',
    parent: 'Gestion Académique',
  },
  {
    path: '/affectations',
    component: GestionAffectationsAcademiques,
    name: 'Affectations Académiques',
    icon: '🔗',
    parent: 'Gestion Académique',
  },
  {
    path: '/specialites',
    component: GestionSpecialites,
    name: 'Gestion Spécialités',
    icon: '🎯',
    parent: 'Gestion Académique',
  },
];

/**
 * Get all routes
 */
export const allRoutes = [...publicRoutes, ...protectedRoutes];

/**
 * Get route by path
 */
export const getRouteByPath = (path) => {
  return allRoutes.find(route => route.path === path);
};

/**
 * Get protected routes grouped by parent (for navigation menu)
 */
export const getGroupedRoutes = () => {
  const grouped = {};
  protectedRoutes.forEach(route => {
    if (route.parent) {
      if (!grouped[route.parent]) {
        grouped[route.parent] = [];
      }
      grouped[route.parent].push(route);
    } else if (route.path !== '/' && !route.redirect) {
      if (!grouped['Main']) {
        grouped['Main'] = [];
      }
      grouped['Main'].push(route);
    }
  });
  return grouped;
};

export default {
  publicRoutes,
  protectedRoutes,
  allRoutes,
  getRouteByPath,
  getGroupedRoutes,
};
