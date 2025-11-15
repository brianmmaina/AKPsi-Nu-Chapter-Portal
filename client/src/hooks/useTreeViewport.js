import { useCallback, useRef } from 'react';
import {
  LEFT_TREE_GUTTER,
  READABILITY_ZOOM,
  RIGHT_TREE_GUTTER,
  SAFE_VIEWPORT_HEIGHT,
  SAFE_VIEWPORT_WIDTH,
} from '../utils/constants';

export const useTreeViewport = ({
  reactFlowInstance,
  flowWrapperRef,
  leftGutter = LEFT_TREE_GUTTER,
  rightGutter = RIGHT_TREE_GUTTER,
  isEmpire,
  familyKey,
  minZoom,
  maxZoom,
  scaleBias = 1,
}) => {
  const treeBoundsRef = useRef({
    width: 0,
    height: 0,
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  });

  const fitTreeToViewport = useCallback(
    (duration = 500, paddingMultiplier = 1.05) => {
      const bounds = treeBoundsRef.current;
      if (!reactFlowInstance || !bounds?.width || !bounds?.height) {
        reactFlowInstance?.fitView?.({ padding: 0.24, duration });
        return;
      }

      const rect = flowWrapperRef?.current?.getBoundingClientRect?.();
      const viewportWidth = rect?.width ?? window.innerWidth;
      const viewportHeight = rect?.height ?? window.innerHeight;

      const usableWidth = Math.max(
        220,
        Math.min(
          viewportWidth - leftGutter - rightGutter,
          SAFE_VIEWPORT_WIDTH - leftGutter - rightGutter,
        ),
      );
      const usableHeight = Math.max(320, Math.min(viewportHeight, SAFE_VIEWPORT_HEIGHT));

      const paddedWidth = bounds.width * paddingMultiplier;
      const paddedHeight = bounds.height * paddingMultiplier;
      const rawScale = Math.min(usableWidth / paddedWidth, usableHeight / paddedHeight);
      const comfortableMinZoom = isEmpire ? 0.38 : 0.42;
      const readabilityFloor = READABILITY_ZOOM[familyKey] ?? 0.64;

      const nextZoom = Math.min(
        maxZoom,
        Math.max(minZoom, rawScale * scaleBias, comfortableMinZoom, readabilityFloor),
      );

      const centerX = bounds.minX + bounds.width / 2;
      const centerY = bounds.minY + bounds.height / 2;
      const viewportCenterX = leftGutter + usableWidth / 2;
      const verticalSafeOffset = Math.max((viewportHeight - usableHeight) / 2, 0);
      const viewportCenterY = verticalSafeOffset + usableHeight / 2;

      const nextX = viewportCenterX - centerX * nextZoom;
      const nextY = viewportCenterY - centerY * nextZoom;

      reactFlowInstance.setViewport?.({ x: nextX, y: nextY, zoom: nextZoom }, { duration });
    },
    [
      reactFlowInstance,
      flowWrapperRef,
      leftGutter,
      rightGutter,
      isEmpire,
      familyKey,
      minZoom,
      maxZoom,
      scaleBias,
    ],
  );

  const fitTreeView = useCallback(
    (duration = 500, paddingMultiplier) => {
      const fallbackPadding = isEmpire ? 1.02 : 1.05;
      const effectivePadding =
        typeof paddingMultiplier === 'number' ? paddingMultiplier : fallbackPadding;
      fitTreeToViewport(duration, effectivePadding);
    },
    [fitTreeToViewport, isEmpire],
  );

  const handleZoom = useCallback(
    (direction) => {
      if (!reactFlowInstance?.getViewport || !reactFlowInstance?.zoomTo) {
        return;
      }
      try {
        const currentViewport = reactFlowInstance.getViewport();
        const factor = direction === 'in' ? 1.15 : 0.85;
        const nextZoom = Math.max(
          minZoom,
          Math.min(maxZoom, (currentViewport?.zoom || 1) * factor),
        );
        reactFlowInstance.zoomTo(nextZoom, { duration: 200 });
      } catch (error) {
        console.warn('Zoom adjustment failed:', error);
      }
    },
    [reactFlowInstance, minZoom, maxZoom],
  );

  const handleFullscreenToggle = useCallback(() => {
    const host = flowWrapperRef?.current;
    if (!host) return;
    try {
      if (!document.fullscreenElement) {
        host.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }, [flowWrapperRef]);

  const projectMarkerPosition = useCallback(
    (markerY) => {
      let screenY;
      try {
        if (reactFlowInstance?.flowToScreenPosition) {
          screenY = reactFlowInstance.flowToScreenPosition({ x: 0, y: markerY }).y;
        } else {
          const vp = reactFlowInstance?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
          screenY = markerY * (vp.zoom || 1) + (vp.y || 0);
        }
      } catch {
        const fallback = reactFlowInstance?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
        screenY = markerY * (fallback.zoom || 1) + (fallback.y || 0);
      }
      const containerTop = flowWrapperRef?.current?.getBoundingClientRect?.().top ?? 0;
      return { y: screenY - containerTop };
    },
    [reactFlowInstance, flowWrapperRef],
  );

  return {
    treeBoundsRef,
    fitTreeView,
    handleZoom,
    handleFullscreenToggle,
    projectMarkerPosition,
  };
};
