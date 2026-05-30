/**
 * API Services
 * Centralized API communication layer
 */

import axios from '../utils/axiosConfig';

// Academique Services
export const academique = {
  getDepartements: () => axios.get('/academique/departements/'),
  getDepartement: (id) => axios.get(`/academique/departements/${id}/`),
  createDepartement: (data) => axios.post('/academique/departements/', data),
  updateDepartement: (id, data) => axios.put(`/academique/departements/${id}/`, data),
  deleteDepartement: (id) => axios.delete(`/academique/departements/${id}/`),
  
  getLicences: () => axios.get('/academique/licences/'),
  getLicence: (id) => axios.get(`/academique/licences/${id}/`),
  createLicence: (data) => axios.post('/academique/licences/', data),
  updateLicence: (id, data) => axios.put(`/academique/licences/${id}/`, data),
  deleteLicence: (id) => axios.delete(`/academique/licences/${id}/`),
  
  getSpecialites: () => axios.get('/academique/specialites/'),
  getSpecialite: (id) => axios.get(`/academique/specialites/${id}/`),
  createSpecialite: (data) => axios.post('/academique/specialites/', data),
  updateSpecialite: (id, data) => axios.put(`/academique/specialites/${id}/`, data),
  deleteSpecialite: (id) => axios.delete(`/academique/specialites/${id}/`),
  
  getModules: () => axios.get('/academique/modules/'),
  getModule: (id) => axios.get(`/academique/modules/${id}/`),
  createModule: (data) => axios.post('/academique/modules/', data),
  updateModule: (id, data) => axios.put(`/academique/modules/${id}/`, data),
  deleteModule: (id) => axios.delete(`/academique/modules/${id}/`),
};

// Etudiants Services
export const etudiants = {
  getEtudiants: () => axios.get('/etudiants/'),
  getEtudiant: (id) => axios.get(`/etudiants/${id}/`),
  createEtudiant: (data) => axios.post('/etudiants/', data),
  updateEtudiant: (id, data) => axios.put(`/etudiants/${id}/`, data),
  deleteEtudiant: (id) => axios.delete(`/etudiants/${id}/`),
  importEtudiants: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post('/etudiants/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Enseignants Services
export const enseignants = {
  getEnseignants: () => axios.get('/enseignants/'),
  getEnseignant: (id) => axios.get(`/enseignants/${id}/`),
  createEnseignant: (data) => axios.post('/enseignants/', data),
  updateEnseignant: (id, data) => axios.put(`/enseignants/${id}/`, data),
  deleteEnseignant: (id) => axios.delete(`/enseignants/${id}/`),
};

// PFEs Services
export const pfes = {
  getPFEs: () => axios.get('/pfes/'),
  getPFE: (id) => axios.get(`/pfes/${id}/`),
  createPFE: (data) => axios.post('/pfes/', data),
  updatePFE: (id, data) => axios.put(`/pfes/${id}/`, data),
  deletePFE: (id) => axios.delete(`/pfes/${id}/`),
  
  getSoutenances: () => axios.get('/soutenances/'),
  getSoutenance: (id) => axios.get(`/soutenances/${id}/`),
  createSoutenance: (data) => axios.post('/soutenances/', data),
  updateSoutenance: (id, data) => axios.put(`/soutenances/${id}/`, data),
  deleteSoutenance: (id) => axios.delete(`/soutenances/${id}/`),
  
  getDashboardStats: () => axios.get('/pfes/dashboard/stats/'),
};

// Auth Services
export const auth = {
  login: (username, password) => axios.post('/api-token-auth/', { username, password }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  },
  changePassword: (oldPassword, newPassword) => 
    axios.post('/change-password/', { old_password: oldPassword, new_password: newPassword }),
};

export default {
  academique,
  etudiants,
  enseignants,
  pfes,
  auth,
};
