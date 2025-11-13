import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Custom hook for lineage highlighting functionality
 * 
 * @param {Array} relationships - Array of relationship objects
 * @param {Object} selectedBrother - Currently selected brother
 * @returns {Object} Lineage highlight state and set
 */
export const useLineageHighlight = (relationships, selectedBrother) => {
  const [lineageHighlightMode, setLineageHighlightMode] = useState('off');
  const [lineageSourceId, setLineageSourceId] = useState(null);

  // Build parent and child maps from relationships
  const parentMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(relationships)) return map;
    relationships.forEach((rel) => {
      if (!rel || !rel.big_id || !rel.little_id) return;
      map.set(String(rel.little_id), String(rel.big_id));
    });
    return map;
  }, [relationships]);

  const childMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(relationships)) return map;
    relationships.forEach((rel) => {
      if (!rel || !rel.big_id || !rel.little_id) return;
      const key = String(rel.big_id);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(String(rel.little_id));
    });
    return map;
  }, [relationships]);

  // Calculate lineage highlight set based on mode and source
  const lineageHighlightSet = useMemo(() => {
    if (lineageHighlightMode === 'off' || !lineageSourceId) {
      return new Set();
    }

    const gatherAncestors = (startId, accumulator) => {
      let current = parentMap.get(startId);
      while (current) {
        accumulator.add(current);
        current = parentMap.get(current);
      }
    };

    const gatherDescendants = (startIds, accumulator) => {
      const queue = [...startIds];
      while (queue.length) {
        const current = queue.shift();
        const children = childMap.get(current) || [];
        children.forEach((child) => {
          if (!accumulator.has(child)) {
            accumulator.add(child);
            queue.push(child);
          }
        });
      }
    };

    const seeded = new Set([lineageSourceId]);
    if (lineageHighlightMode === 'ancestors' || lineageHighlightMode === 'both') {
      gatherAncestors(lineageSourceId, seeded);
    }
    if (lineageHighlightMode === 'descendants' || lineageHighlightMode === 'both') {
      gatherDescendants([lineageSourceId], seeded);
    }
    return seeded;
  }, [lineageHighlightMode, lineageSourceId, parentMap, childMap]);

  // Update source ID when selected brother changes
  useEffect(() => {
    if (lineageHighlightMode === 'off') {
      setLineageSourceId(null);
      return;
    }
    if (selectedBrother) {
      setLineageSourceId(String(selectedBrother.id));
    }
  }, [lineageHighlightMode, selectedBrother]);

  // Helper to set source ID from brother ID
  const setSourceFromBrotherId = useCallback((brotherId) => {
    if (brotherId) {
      setLineageSourceId(String(brotherId));
    }
  }, []);

  return {
    lineageHighlightMode,
    setLineageHighlightMode,
    lineageSourceId,
    setLineageSourceId,
    lineageHighlightSet,
    setSourceFromBrotherId,
    parentMap,
    childMap,
  };
};

