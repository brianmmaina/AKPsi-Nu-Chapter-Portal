import { useMemo } from 'react';
import { calculateTreeLayout } from '../utils/treeLayout';

export const useTreeLayout = ({
  brothers,
  relationships,
  familyKey,
  theme,
  layoutSettings,
  highlightBrotherId,
  lineageHighlightSet,
  renderNodeContent,
  onTreeBounds,
  leftMargin,
}) => {
  return useMemo(() => {
    if (!Array.isArray(brothers) || brothers.length === 0) {
      return { nodes: [], edges: [], pledgeMarkers: [], stats: { total: 0, classes: 0, placeholders: 0 } };
    }

    const layoutResult = calculateTreeLayout({
      brothers,
      relationships,
      familyKey,
      theme,
      layoutSettings,
      highlightBrotherId,
      lineageHighlightSet,
      renderNodeContent,
      isEmpire: familyKey === 'empire',
      onTreeBounds,
      leftMargin,
    });

    const pledgeMarkers = Array.isArray(layoutResult?.pledgeMarkers)
      ? layoutResult.pledgeMarkers
      : [];

    const uniqueClasses = new Set();
    let placeholderCount = 0;
    brothers.forEach((bro) => {
      if (!bro?.name || /^unassigned/i.test(bro.name.trim())) {
        placeholderCount += 1;
      }
      if (bro?.pledge_class) {
        uniqueClasses.add(bro.pledge_class.trim().toUpperCase());
      }
    });

    const stats = {
      total: brothers.length,
      classes: uniqueClasses.size,
      placeholders: placeholderCount,
    };

    return {
      nodes: layoutResult?.nodes || [],
      edges: layoutResult?.edges || [],
      pledgeMarkers,
      stats,
    };
  }, [
    brothers,
    relationships,
    familyKey,
    theme,
    layoutSettings,
    highlightBrotherId,
    lineageHighlightSet,
    renderNodeContent,
    onTreeBounds,
    leftMargin,
  ]);
};
