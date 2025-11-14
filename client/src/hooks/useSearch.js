import { useState, useCallback, useRef, useEffect } from 'react';
import { families as familiesApi } from '../api';

// Cache key for localStorage
const SEARCH_INDEX_CACHE_KEY = 'akpsi_search_index_cache';
const SEARCH_INDEX_VERSION = '1.0'; // Increment when index structure changes
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Enhanced custom hook for search functionality
 * 
 * Features:
 * - Multi-field search (name, pledge class, major, graduation year)
 * - Cached search index in localStorage for performance
 * - Cross-family navigation support
 * 
 * @param {Object} family - Current family object
 * @param {Array} brothers - Current family's brothers
 * @param {Function} onFocusNode - Callback to focus on a node
 * @param {Function} onToast - Callback for toast notifications
 * @param {Function} onSwitchFamily - Callback to switch to another family (optional)
 * @param {Array} allFamilies - List of all families (optional, for faster switching)
 * @returns {Object} Search state and handlers
 */
export const useSearch = (family, brothers, onFocusNode, onToast, onSwitchFamily = null, allFamilies = null) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchField, setSearchField] = useState('all'); // 'all', 'name', 'pledge_class', 'major', 'graduation_year'
  const searchIndexRef = useRef([]);
  const buildingIndexRef = useRef(false);
  const indexVersionRef = useRef(null);
  const indexTimestampRef = useRef(null);
  
  // Safety check: ensure brothers is an array
  const safeBrothers = Array.isArray(brothers) ? brothers : [];
  
  // Safety check: ensure family is an object or null, never undefined
  const safeFamily = family && typeof family === 'object' ? family : null;

  const normalizeSearchValue = useCallback(
    (value) =>
      value
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '',
    [],
  );

  /**
   * Builds a comprehensive search index entry for a brother
   * Includes normalized versions of: name, pledge class, major, graduation year
   */
  const buildBrotherIndexEntry = useCallback((brother, familyId, familyName) => {
    if (!brother?.name) return null;

    const resolvedName = familyName || `Family ${familyId}`;
    const normalizedName = normalizeSearchValue(brother.name);
    const normalizedPledgeClass = brother.pledge_class ? normalizeSearchValue(brother.pledge_class) : '';
    const normalizedMajor = brother.major ? normalizeSearchValue(brother.major) : '';
    const graduationYear = brother.graduation_year ? String(brother.graduation_year) : '';

    return {
      // Original data
      name: brother.name,
      brother,
      familyId,
      familyName: resolvedName,
      
      // Normalized search fields
      normalizedName,
      normalizedPledgeClass,
      normalizedMajor,
      graduationYear,
      
      // Combined search text (for 'all' field searches)
      normalizedAll: `${normalizedName} ${normalizedPledgeClass} ${normalizedMajor} ${graduationYear}`.trim(),
    };
  }, [normalizeSearchValue]);

  /**
   * Loads search index from localStorage cache
   */
  const loadCachedIndex = useCallback(() => {
    try {
      const cached = localStorage.getItem(SEARCH_INDEX_CACHE_KEY);
      if (!cached) return false;

      const parsed = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is valid
      if (
        parsed.version !== SEARCH_INDEX_VERSION ||
        !parsed.index ||
        !Array.isArray(parsed.index) ||
        !parsed.timestamp ||
        (now - parsed.timestamp) > CACHE_EXPIRY_MS
      ) {
        // Cache is invalid or expired
        localStorage.removeItem(SEARCH_INDEX_CACHE_KEY);
        return false;
      }

      // Cache is valid, load it
      searchIndexRef.current = parsed.index;
      indexVersionRef.current = parsed.version;
      indexTimestampRef.current = parsed.timestamp;
      return true;
    } catch (error) {
      console.warn('Failed to load cached search index:', error);
      localStorage.removeItem(SEARCH_INDEX_CACHE_KEY);
      return false;
    }
  }, []);

  /**
   * Saves search index to localStorage cache
   */
  const saveCachedIndex = useCallback(() => {
    try {
      const cache = {
        version: SEARCH_INDEX_VERSION,
        timestamp: Date.now(),
        index: searchIndexRef.current,
      };
      localStorage.setItem(SEARCH_INDEX_CACHE_KEY, JSON.stringify(cache));
      indexTimestampRef.current = cache.timestamp;
    } catch (error) {
      console.warn('Failed to save search index cache:', error);
      // If storage is full, try to clear old cache and retry
      try {
        localStorage.removeItem(SEARCH_INDEX_CACHE_KEY);
        const cache = {
          version: SEARCH_INDEX_VERSION,
          timestamp: Date.now(),
          index: searchIndexRef.current,
        };
        localStorage.setItem(SEARCH_INDEX_CACHE_KEY, JSON.stringify(cache));
      } catch (retryError) {
        console.error('Failed to save search index cache after retry:', retryError);
      }
    }
  }, []);

  /**
   * Updates index with a specific family's brothers
   */
  const updateIndexWithFamily = useCallback(
    (familyId, familyName, brotherList) => {
      if (!familyId || !Array.isArray(brotherList)) return;
      
      // Remove existing entries for this family
      searchIndexRef.current = searchIndexRef.current.filter((entry) => entry.familyId !== familyId);
      
      // Add new entries
      brotherList.forEach((brother) => {
        const entry = buildBrotherIndexEntry(brother, familyId, familyName);
        if (entry) {
          searchIndexRef.current.push(entry);
        }
      });
      
      // Save to cache
      saveCachedIndex();
    },
    [buildBrotherIndexEntry, saveCachedIndex],
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

  /**
   * Builds global search index for all families
   * Uses cache when available and valid
   */
  const buildGlobalIndex = useCallback(async () => {
    // Check if cache is valid
    if (loadCachedIndex() && searchIndexRef.current.length > 0) {
      return; // Use cached index
    }

    await waitForIndexBuild();
    if (buildingIndexRef.current) return; // Another build in progress

    buildingIndexRef.current = true;
    try {
      // Clear existing index
      searchIndexRef.current = [];

      // Use provided families list if available, otherwise fetch
      let familiesList = allFamilies;
      if (!familiesList || !Array.isArray(familiesList) || familiesList.length === 0) {
      const response = await familiesApi.getAll();
        familiesList = response.data || [];
      }

      // Index all families
      await Promise.all(
        familiesList.map(async (fam) => {
          try {
            const tree = await familiesApi.getTree(fam.id);
            const brothers = tree.data?.brothers || [];
            brothers.forEach((brother) => {
              const entry = buildBrotherIndexEntry(brother, fam.id, fam.name);
              if (entry) {
                searchIndexRef.current.push(entry);
              }
            });
          } catch (error) {
            console.warn('Failed to index family', fam?.name, error);
          }
        }),
      );

      // Save to cache
      saveCachedIndex();
    } catch (error) {
      console.error('Failed to build search index:', error);
      throw error;
    } finally {
      buildingIndexRef.current = false;
    }
  }, [allFamilies, buildBrotherIndexEntry, loadCachedIndex, saveCachedIndex, waitForIndexBuild]);

  /**
   * Searches the index based on search field
   */
  const searchIndex = useCallback((normalizedQuery, field) => {
    if (!normalizedQuery || !searchIndexRef.current.length) return [];

    return searchIndexRef.current.filter((entry) => {
      switch (field) {
        case 'name':
          return entry.normalizedName.includes(normalizedQuery);
        case 'pledge_class':
          return entry.normalizedPledgeClass.includes(normalizedQuery);
        case 'major':
          return entry.normalizedMajor.includes(normalizedQuery);
        case 'graduation_year':
          return entry.graduationYear.includes(normalizedQuery);
        case 'all':
        default:
          return entry.normalizedAll.includes(normalizedQuery);
      }
    });
  }, []);

  /**
   * Handles search submission
   */
  const handleSearchSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const query = searchTerm.trim();
      if (!query) {
        if (onToast) {
          onToast({ message: 'Enter a search term.', type: 'info' });
        }
        return;
      }
      if (!safeFamily || !safeFamily.id) {
        if (onToast) {
          onToast({ message: 'Family not loaded. Please wait.', type: 'warning' });
        }
        return;
      }

      const normalizedQuery = normalizeSearchValue(query);
      setIsSearching(true);
      
      try {
        // Update current family's index
        updateIndexWithFamily(safeFamily.id, safeFamily.name || `Family ${safeFamily.id}`, safeBrothers);
        
        // Build global index (will use cache if available)
        await buildGlobalIndex();
        
        // Search the index
        const matches = searchIndex(normalizedQuery, searchField);
        
        if (matches.length === 0) {
          if (onToast) {
            const fieldLabel = searchField === 'all' ? '' : ` in ${searchField.replace('_', ' ')}`;
            onToast({ 
              message: `No member found${fieldLabel}. Try a different search term.`, 
              type: 'info' 
            });
          }
          setIsSearching(false);
          return;
        }

        // Choose best match (exact match preferred)
        const chooseBestMatch = (list) => {
          if (!list.length) return null;
          
          // Try to find exact match first
          const exact = list.find((entry) => {
            switch (searchField) {
              case 'name':
                return entry.normalizedName === normalizedQuery;
              case 'pledge_class':
                return entry.normalizedPledgeClass === normalizedQuery;
              case 'major':
                return entry.normalizedMajor === normalizedQuery;
              case 'graduation_year':
                return entry.graduationYear === normalizedQuery;
              default:
                return entry.normalizedName === normalizedQuery;
            }
          });
          
          return exact || list[0];
        };

        // Check for matches in current family first
        const currentMatches = matches.filter((entry) => entry.familyId === safeFamily.id);
        
        if (currentMatches.length) {
          // Match found in current family
          const target = chooseBestMatch(currentMatches);
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
          }
        } else {
          // Match found in another family
          const target = chooseBestMatch(matches);
          if (target) {
            const familyName = target.familyName || 'another family';
            const matchCount = matches.length;
            
            if (onSwitchFamily && allFamilies && Array.isArray(allFamilies)) {
              // Find the family object
              const targetFamily = allFamilies.find((f) => f.id === target.familyId);
              
              if (targetFamily) {
                // Switch to the family
                onSwitchFamily(targetFamily);
                
                // Focus on the node after a short delay to allow family to load
                setTimeout(() => {
                  if (target.brother && target.brother.id && onFocusNode) {
                    onFocusNode(target.brother.id);
                  }
                }, 500);
                
                if (onToast) {
                  if (matchCount === 1) {
                    onToast({ 
                      message: `Found ${target.name} in ${familyName}. Switching...`, 
                      type: 'success' 
                    });
                  } else {
                    onToast({ 
                      message: `Found ${matchCount} matches. Switching to ${target.name} in ${familyName}...`, 
                      type: 'success' 
                    });
                  }
                }
              } else {
                // Family not found in allFamilies list
                if (onToast) {
                  onToast({ 
                    message: `Found ${target.name} in ${familyName}, but could not switch.`, 
                    type: 'info' 
                  });
                }
              }
            } else {
              // No switch function provided, just show message
            if (onToast) {
                if (matchCount === 1) {
                  onToast({ 
                    message: `Found ${target.name} in ${familyName}.`, 
                    type: 'info' 
                  });
                } else {
                  onToast({ 
                    message: `Found ${matchCount} matches. ${target.name} is in ${familyName}.`, 
                    type: 'info' 
                  });
                }
              }
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
    [
      searchTerm, 
      searchField,
      normalizeSearchValue, 
      updateIndexWithFamily, 
      safeFamily, 
      safeBrothers, 
      buildGlobalIndex, 
      searchIndex,
      onFocusNode, 
      onToast,
      onSwitchFamily,
      allFamilies,
    ],
  );

  /**
   * Clears the search index cache (useful for debugging or forcing refresh)
   */
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_INDEX_CACHE_KEY);
      searchIndexRef.current = [];
      indexVersionRef.current = null;
      indexTimestampRef.current = null;
    } catch (error) {
      console.warn('Failed to clear search index cache:', error);
    }
  }, []);

  // Update index when brothers change
  useEffect(() => {
    if (safeFamily && safeFamily.id && safeBrothers.length > 0) {
      updateIndexWithFamily(safeFamily.id, safeFamily.name || `Family ${safeFamily.id}`, safeBrothers);
    }
  }, [safeFamily?.id, safeFamily?.name, safeBrothers, updateIndexWithFamily]);

  // Try to load cached index on mount
  useEffect(() => {
    loadCachedIndex();
  }, [loadCachedIndex]);

  return {
    searchTerm,
    setSearchTerm,
    searchField,
    setSearchField,
    isSearching,
    handleSearchSubmit,
    updateIndexWithFamily,
    clearCache,
  };
};
