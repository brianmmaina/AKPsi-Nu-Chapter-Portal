import { useState, useCallback, useRef, useEffect } from 'react';
import { families as familiesApi } from '../api';

/**
 * Custom hook for search functionality
 * 
 * @param {Object} family - Current family object
 * @param {Array} brothers - Current family's brothers
 * @param {Function} onFocusNode - Callback to focus on a node
 * @param {Function} onToast - Callback for toast notifications
 * @returns {Object} Search state and handlers
 */
export const useSearch = (family, brothers, onFocusNode, onToast) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchIndexRef = useRef([]);
  const buildingIndexRef = useRef(false);
  
  // Safety check: ensure brothers is an array
  const safeBrothers = Array.isArray(brothers) ? brothers : [];

  const normalizeSearchValue = useCallback(
    (value) =>
      value
        ?.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '',
    [],
  );

  const updateIndexWithFamily = useCallback(
    (familyId, familyName, brotherList) => {
      if (!familyId || !Array.isArray(brotherList)) return;
      const resolvedName = familyName || `Family ${familyId}`;
      searchIndexRef.current = searchIndexRef.current.filter((entry) => entry.familyId !== familyId);
      brotherList.forEach((brother) => {
        if (!brother?.name) return;
        searchIndexRef.current.push({
          normalized: normalizeSearchValue(brother.name),
          name: brother.name,
          brother,
          familyId,
          familyName: resolvedName,
        });
      });
    },
    [normalizeSearchValue],
  );

  const waitForIndexBuild = useCallback(async () => {
    if (!buildingIndexRef.current) return;
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!buildingIndexRef.current) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }, []);

  const buildGlobalIndex = useCallback(async () => {
    if (searchIndexRef.current.length) return;
    await waitForIndexBuild();
    if (searchIndexRef.current.length) return;

    buildingIndexRef.current = true;
    try {
      const response = await familiesApi.getAll();
      const allFamilies = response.data || [];
      await Promise.all(
        allFamilies.map(async (fam) => {
          try {
            const tree = await familiesApi.getTree(fam.id);
            updateIndexWithFamily(fam.id, fam.name, tree.data?.brothers || []);
          } catch (error) {
            console.warn('Failed to index family', fam?.name, error);
          }
        }),
      );
    } catch (error) {
      console.error('Failed to build search index:', error);
      throw error;
    } finally {
      buildingIndexRef.current = false;
    }
  }, [updateIndexWithFamily, waitForIndexBuild]);

  const handleSearchSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const query = searchTerm.trim();
      if (!query) {
        if (onToast) {
          onToast({ message: 'Enter a name to search.', type: 'info' });
        }
        return;
      }
      if (!family || !family.id) {
        if (onToast) {
          onToast({ message: 'Family not loaded. Please wait.', type: 'warning' });
        }
        return;
      }
      const normalizedQuery = normalizeSearchValue(query);
      setIsSearching(true);
      try {
        // Use safeBrothers instead of brothers to ensure it's always an array
        updateIndexWithFamily(family.id, family.name || `Family ${family.id}`, safeBrothers);
        await buildGlobalIndex();
        const matches = searchIndexRef.current.filter((entry) =>
          entry.normalized.includes(normalizedQuery),
        );
        if (matches.length === 0) {
          if (onToast) {
            onToast({ message: 'No member found across the archive.', type: 'info' });
          }
          return;
        }

        const chooseBestMatch = (list) => {
          if (!list.length) return null;
          const exact = list.find((entry) => entry.normalized === normalizedQuery);
          return exact || list[0];
        };

        const currentMatches = matches.filter((entry) => entry.familyId === family.id);
        if (currentMatches.length) {
          const target = chooseBestMatch(currentMatches);
          // Safety check: ensure target.brother exists and has an id
          if (target && target.brother && target.brother.id && onFocusNode) {
            if (onFocusNode(target.brother.id)) {
              if (onToast) {
                onToast({ message: `Centered on ${target.name}.`, type: 'success' });
              }
            } else {
              if (onToast) {
                onToast({ message: 'Found a match but could not center the node.', type: 'warning' });
              }
            }
          } else {
            if (onToast) {
              onToast({ message: 'Found a match but could not access node data.', type: 'warning' });
            }
          }
        } else {
          const target = chooseBestMatch(matches);
          if (target && target.familyName) {
            const familyName = target.familyName || 'another family';
            if (onToast) {
              onToast({ message: `Not in this family. Found in ${familyName}.`, type: 'info' });
            }
          } else {
            if (onToast) {
              onToast({ message: 'No member found across the archive.', type: 'info' });
            }
          }
        }
      } catch (error) {
        console.error('Search failed:', error);
        if (onToast) {
          onToast({ message: 'Search failed. Please try again.', type: 'error' });
        }
      } finally {
        setIsSearching(false);
      }
    },
    [searchTerm, normalizeSearchValue, updateIndexWithFamily, family, safeBrothers, buildGlobalIndex, onFocusNode, onToast],
  );

  // Update index when brothers change
  useEffect(() => {
    if (family && family.id && safeBrothers.length > 0) {
      updateIndexWithFamily(family.id, family.name || `Family ${family.id}`, safeBrothers);
    }
  }, [family?.id, family?.name, safeBrothers, updateIndexWithFamily]);

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearchSubmit,
    updateIndexWithFamily,
  };
};

