import { useCallback, useRef } from 'react';
import { READABILITY_ZOOM } from '../utils/constants';

export const useTreeViewport = ({
  reactFlowInstance,
  leftGutter,
  rightGutter,
  isEmpire,
  familyKey,
  minZoom,
  maxZoom,
}) => {
  const treeBoundsRef = useRef({ width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 });

  const fitTreeToViewport = useCallback(
    (duration = 500, paddingMultiplier = 1.0) => {
      const bounds = treeBoundsRef.current;
      if (!reactFlowInstance || !bounds?.width || !bounds?.height) {
        reactFlowInstance?.fitView?.({ padding: 0.24, duration });
        return;
      }

      const wrapper = document.querySelector('.tree-root__body');
      const rect = wrapper?.getBoundingClientRect?.();
      const viewportWidth = rect?.width || window.innerWidth;
      const viewportHeight = rect?.height || window.innerHeight;
      const paddedWidth = bounds.width * paddingMultiplier;
      const paddedHeight = bounds.height * paddingMultiplier;
      const usableWidth = Math.max(200, viewportWidth - leftGutter - rightGutter);
      const safeZoom = READABILITY_ZOOM[familyKey] || 0.64;
      const rawScale = Math.min(usableWidth / paddedWidth, viewportHeight / paddedHeight);
      const comfortableMinZoom = isEmpire ? 0.38 : 0.42;
      const nextZoom = Math.min(
        maxZoom,
        Math.max(minZoom, Math.max(rawScale, comfortableMinZoom, safeZoom)),
      );
      const centerX = bounds.minX + bounds.width / 2;
      const centerY = bounds.minY + bounds.height / 2;
      const nextX = leftGutter + usableWidth / 2 - centerX * nextZoom;
      const nextY = viewportHeight / 2 - centerY * nextZoom;
      reactFlowInstance.setViewport?.({ x: nextX, y: nextY, zoom: nextZoom }, { duration });
    },
    [reactFlowInstance, leftGutter, rightGutter, isEmpire, familyKey, minZoom, maxZoom],
  );

  return {
    treeBoundsRef,
    fitTreeToViewport,
  };
};
