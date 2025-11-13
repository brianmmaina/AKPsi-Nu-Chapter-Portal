import { useState, useEffect, useCallback } from 'react';
import { families as familiesApi } from '../api';

/**
 * Custom hook for loading and managing tree data
 * 
 * @param {Object} family - Family object with id
 * @param {Function} onToast - Optional callback for toast notifications
 * @returns {Object} Tree data state and loading function
 */
export const useTreeData = (family, onToast) => {
  const [brothers, setBrothers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTreeReady, setIsTreeReady] = useState(false);

  const loadTreeData = useCallback(async () => {
    if (!family || !family.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsTreeReady(false); // Reset fade-in state when loading new family
      const response = await familiesApi.getTree(family.id);
      
      // Safety check: ensure response.data exists and has expected structure
      if (!response || !response.data) {
        throw new Error('Invalid API response: missing data');
      }
      
      // Ensure brothers and relationships are arrays
      const brothersData = Array.isArray(response.data.brothers) ? response.data.brothers : [];
      const relationshipsData = Array.isArray(response.data.relationships) ? response.data.relationships : [];
      
      setBrothers(brothersData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error('Failed to load tree data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load family tree';
      setError(errorMessage);
      
      // Reset data on error to prevent stale data
      setBrothers([]);
      setRelationships([]);
      
      if (onToast) {
        onToast({ message: 'Failed to load family tree. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
      // Trigger fade-in animation after data is loaded
      setTimeout(() => {
        setIsTreeReady(true);
      }, 50);
    }
  }, [family?.id, onToast]);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  return {
    brothers,
    relationships,
    loading,
    error,
    isTreeReady,
    reloadTreeData: loadTreeData,
  };
};

