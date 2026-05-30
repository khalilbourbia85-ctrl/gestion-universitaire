/**
 * Application Constants
 * Centralized constants for the application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'administrateur',
  TEACHER: 'enseignant',
  CHEF_DEPT: 'chef_departement',
  STUDENT: 'etudiant',
};

// Academic Years
export const ACADEMIC_YEARS = [
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
];

// PFE Status
export const PFE_STATUS = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  SUBMITTED: 'Soumis',
  DEFENDED: 'Soutenu',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

// Defense Status
export const DEFENSE_STATUS = {
  PENDING: 'En attente',
  SCHEDULED: 'Programmée',
  IN_PROGRESS: 'En cours',
  PASSED: 'Réussi',
  FAILED: 'Échoué',
};

// Gender Options
export const GENDERS = {
  MALE: 'Homme',
  FEMALE: 'Femme',
  OTHER: 'Autre',
};

// Message Types
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  ROLE: 'role',
  USER_ID: 'user_id',
  THEME: 'theme',
  LANGUAGE: 'language',
};

export default {
  API_CONFIG,
  USER_ROLES,
  ACADEMIC_YEARS,
  PFE_STATUS,
  DEFENSE_STATUS,
  GENDERS,
  MESSAGE_TYPES,
  PAGINATION,
  STORAGE_KEYS,
};
