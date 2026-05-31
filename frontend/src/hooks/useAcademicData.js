import { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';

/**
 * Hook personnalisé pour charger et gérer les licences et spécialités
 * avec un système de cache et de refresh automatique
 * 
 * @param {number} refreshInterval - Intervalle de refresh automatique en ms (0 pour désactiver)
 * @returns {object} - { licences, specialites, loading, error, refresh, refreshLicences, refreshSpecialites }
 */
export const useAcademicData = (refreshInterval = 0) => {
  const [licences, setLicences] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les licences
  const refreshLicences = useCallback(async () => {
    try {
      const response = await axios.get('licences/');
      setLicences(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      console.error('Erreur chargement licences:', errorMsg);
      setError(errorMsg);
      return [];
    }
  }, []);

  // Charger les spécialités
  const refreshSpecialites = useCallback(async () => {
    try {
      const response = await axios.get('specialites/');
      setSpecialites(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      console.error('Erreur chargement spécialités:', errorMsg);
      setError(errorMsg);
      return [];
    }
  }, []);

  // Charger les deux au montage
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [licRes, specRes] = await Promise.all([
        refreshLicences(),
        refreshSpecialites()
      ]);
      setLoading(false);
      return { licences: licRes, specialites: specRes };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [refreshLicences, refreshSpecialites]);

  // Charger au montage UNIQUEMENT
  useEffect(() => {
    refresh();
    // On ne veut pas inclure refresh comme dépendance ici
    // pour éviter la boucle infinie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh si intervalle fourni
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(async () => {
      console.log('🔄 Auto-refresh des données académiques...');
      // Charger directement sans appeler refresh() pour éviter les dépendances
      try {
        const [licRes, specRes] = await Promise.all([
          axios.get('licences/'),
          axios.get('specialites/')
        ]);
        setLicences(licRes.data);
        setSpecialites(specRes.data);
        setError(null);
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message;
        console.error('Erreur auto-refresh:', errorMsg);
        setError(errorMsg);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    licences,
    specialites,
    loading,
    error,
    refresh,
    refreshLicences,
    refreshSpecialites
  };
};

export default useAcademicData;
