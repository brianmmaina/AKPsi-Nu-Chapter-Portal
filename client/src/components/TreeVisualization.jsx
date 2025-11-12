import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { families as familiesApi } from '../api';
import BrotherDetailModal from './BrotherDetailModal';
import AddNodeForm from './AddNodeForm';
import { getThemeStyles } from '../themes';
import { hexToRgba } from '../utils/color';

const FAMILY_PRESENTATION = {
  empire: {
    crestLetter: 'E',
    accent: '#c9a857',
    title: 'Empire Archives',
    subtitle: 'Alpha Kappa Psi · Nu Chapter',
    backgroundLayers: [
      'radial-gradient(circle at 50% -10%, rgba(201,168,87,0.18) 0%, rgba(248,247,243,0) 55%)',
      'linear-gradient(135deg, rgba(160,130,62,0.12) 0%, rgba(248,247,243,0) 60%)',
    ],
    header: {
      textColor: 'rgba(59, 43, 22, 0.72)',
      crestBg: 'rgba(201,168,87,0.15)',
      crestColor: '#5a3d16',
      panelBg: 'rgba(255, 245, 224, 0.82)',
      shadow: '0 12px 24px rgba(201, 168, 87, 0.22)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(201,168,87,0.12)',
      border: '1px solid rgba(201,168,87,0.45)',
      textColor: 'rgba(59,43,22,0.75)',
    },
  },
  power: {
    crestLetter: 'P',
    accent: '#f5d283',
    title: 'Power Ledger',
    subtitle: 'Strategic Lineage Records',
    backgroundLayers: [
      'radial-gradient(circle at 50% -20%, rgba(247,227,168,0.22) 0%, rgba(9,20,32,0) 60%)',
      'linear-gradient(135deg, rgba(16,38,64,0.4) 0%, rgba(10,20,33,0.05) 65%)',
    ],
    header: {
      textColor: 'rgba(248, 235, 206, 0.82)',
      crestBg: 'rgba(245,210,131,0.18)',
      crestColor: '#f8e7c2',
      panelBg: 'rgba(16, 34, 54, 0.8)',
      shadow: '0 12px 28px rgba(8, 16, 24, 0.4)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(15,32,49,0.78)',
      border: '1px solid rgba(245,210,131,0.35)',
      textColor: 'rgba(247, 235, 206, 0.82)',
    },
  },
  greed: {
    crestLetter: 'G',
    accent: '#e7f28f',
    title: 'Greed Chronicles',
    subtitle: 'Commerce & Ambition Registry',
    backgroundLayers: [
      'radial-gradient(circle at 50% -10%, rgba(210,240,150,0.24) 0%, rgba(12,35,23,0) 55%)',
      'linear-gradient(135deg, rgba(10,35,23,0.35) 0%, rgba(12,35,23,0.05) 60%)',
    ],
    header: {
      textColor: 'rgba(12, 35, 23, 0.82)',
      crestBg: 'rgba(244,217,97,0.18)',
      crestColor: '#1c3b28',
      panelBg: 'rgba(241, 250, 233, 0.88)',
      shadow: '0 12px 26px rgba(11, 35, 22, 0.22)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(241,250,233,0.88)',
      border: '1px solid rgba(244,217,97,0.35)',
      textColor: 'rgba(12,35,23,0.82)',
    },
  },
  pride: {
    crestLetter: 'P',
    accent: '#d4af7e',
    title: 'Pride Registry',
    subtitle: 'Heritage of Excellence',
    backgroundLayers: [
      'radial-gradient(circle at 50% -15%, rgba(212,175,126,0.18) 0%, rgba(27,16,9,0) 60%)',
      'linear-gradient(135deg, rgba(33, 20, 12, 0.55) 0%, rgba(27,17,11,0.1) 62%)',
    ],
    header: {
      textColor: 'rgba(250, 240, 225, 0.86)',
      crestBg: 'rgba(212,175,126,0.22)',
      crestColor: '#f5ddaf',
      panelBg: 'rgba(38, 25, 16, 0.8)',
      shadow: '0 14px 32px rgba(0,0,0,0.35)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(35,29,23,0.82)',
      border: '1px solid rgba(212,175,126,0.4)',
      textColor: 'rgba(248, 245, 239, 0.82)',
    },
  },
  wolfpack: {
    crestLetter: 'W',
    accent: '#8ca6d1',
    title: 'Wolfpack Archives',
    subtitle: 'Brotherhood & Unity Ledger',
    backgroundLayers: [
      'radial-gradient(circle at 50% -12%, rgba(140,166,209,0.22) 0%, rgba(22,32,52,0) 58%)',
      'linear-gradient(135deg, rgba(28,42,66,0.42) 0%, rgba(22,32,52,0.08) 60%)',
    ],
    header: {
      textColor: 'rgba(214,223,240,0.88)',
      crestBg: 'rgba(140,166,209,0.2)',
      crestColor: '#1f2f49',
      panelBg: 'rgba(33, 45, 69, 0.85)',
      shadow: '0 14px 30px rgba(26, 37, 58, 0.32)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(33,45,69,0.85)',
      border: '1px solid rgba(140,166,209,0.35)',
      textColor: 'rgba(214,223,240,0.88)',
    },
  },
  default: {
    crestLetter: 'A',
    accent: '#d4b067',
    title: 'Family Records',
    subtitle: 'Alpha Kappa Psi',
    backgroundLayers: [],
    header: {
      textColor: '#3a2c19',
      crestBg: 'rgba(212,176,103,0.18)',
      crestColor: '#3a2c19',
      panelBg: 'rgba(255, 249, 236, 0.86)',
      shadow: '0 10px 22px rgba(58, 43, 21, 0.16)',
    },
    legend: {
      title: 'Navigation',
      lines: ['0 reset view', '+ zoom in · - zoom out'],
      panelBg: 'rgba(255,249,236,0.86)',
      border: '1px solid rgba(212,176,103,0.4)',
      textColor: '#3a2c19',
    },
  },
};

/**
 * TreeVisualizationInner Component
 * 
 * Renders an interactive family tree visualization using React Flow.
 * Handles tree layout, node interactions, and data loading.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.family - Family object with id, name, and theme
 * @param {Function} props.onToast - Callback function to show toast notifications
 * @param {Function} props.onChangeFamily - Callback to change the selected family
 * @returns {JSX.Element} React Flow tree visualization
 */
const statusLabelForBrother = (brother) => {
  const normalized = (brother.status || '').toLowerCase().trim();
  const gradYear = brother.graduation_year;

  if (normalized === 'graduated' || normalized === 'alumni') {
    return gradYear ? `Graduated · ${gradYear}` : 'Graduated';
  }

  if (normalized === 'studying' || normalized === 'active' || normalized === 'current') {
    return 'Currently Studying';
  }

  if (normalized === 'prospective') {
    return 'Prospective Member';
  }

  if (gradYear) {
    return `Class of ${gradYear}`;
  }

  return brother.status || 'Status Pending';
};

const TreeVisualizationInner = ({ family, onToast, onChangeFamily }) => {
  const [brothers, setBrothers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedBrother, setSelectedBrother] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormParent, setAddFormParent] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTreeReady, setIsTreeReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewportBeforeModal, setViewportBeforeModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [toast, setToast] = useState(null);
  const [highlightBrotherId, setHighlightBrotherId] = useState(null);
  const [lineageHighlightMode, setLineageHighlightMode] = useState('off');
  const [lineageSourceId, setLineageSourceId] = useState(null);
  const initialViewportRef = useRef(null);
  const treeBoundsRef = useRef({ width: 0, height: 0 });
  const searchIndexRef = useRef([]);
  const buildingIndexRef = useRef(false);
  const toastTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const hasFitRef = useRef(false);
  const reactFlowInstance = useReactFlow();

  // Safety check: ensure family prop exists (after hooks)
  if (!family || !family.theme) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Family data not available. Please select a family.</p>
        </div>
      </div>
    );
  }

  // Memoize theme to prevent infinite re-renders
  const theme = useMemo(() => {
    if (!family || !family.theme) return getThemeStyles('default');
    return getThemeStyles(family.theme);
  }, [family?.theme]);
  const familyKey = family?.theme || 'default';
  const presentation = useMemo(
    () => FAMILY_PRESENTATION[familyKey] || FAMILY_PRESENTATION.default,
    [familyKey],
  );
  const isEmpire = familyKey === 'empire';
  const isPower = familyKey === 'power';
  const isGreed = familyKey === 'greed';
  const isPride = familyKey === 'pride';
  const isWolfpack = familyKey === 'wolfpack';
  const defaultViewport = useMemo(() => {
    if (isEmpire) return { x: 0, y: 0, zoom: 0.6 };
    if (isPower) return { x: 0, y: 0, zoom: 0.7 };
    if (isGreed) return { x: 0, y: 0, zoom: 0.72 };
    if (isPride) return { x: 0, y: 0, zoom: 0.73 };
    if (isWolfpack) return { x: 0, y: 0, zoom: 0.74 };
    return { x: 0, y: 0, zoom: 0.75 };
  }, [isEmpire, isPower, isGreed, isPride, isWolfpack]);
  const minZoom = isEmpire ? 0.12 : 0.18;
  const maxZoom = isEmpire ? 1.4 : 2;
  const composedBackground = useMemo(() => {
    const layers = [];
    if (presentation.backgroundLayers?.length) {
      layers.push(...presentation.backgroundLayers);
    }
    if (theme.backgroundTexture) {
      layers.push(theme.backgroundTexture);
    }
    return layers.join(', ');
  }, [presentation.backgroundLayers, theme.backgroundTexture]);

  const containerStyle = useMemo(() => {
    const sizeValue = isEmpire
      ? theme.backgroundTexture
        ? '100% 100%, 100% 100%, 280px 280px'
        : '100% 100%, 100% 100%'
      : theme.backgroundTexture
        ? '280px 280px'
        : undefined;

    return {
      width: '100%',
      height: '100vh',
      backgroundColor: theme.background,
      backgroundImage: composedBackground || undefined,
      backgroundSize: sizeValue,
      backgroundPosition: 'center',
      pointerEvents: 'auto',
      opacity: isTreeReady ? 1 : 0,
      transform: isTreeReady ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
      position: 'relative',
      overflow: 'hidden',
    };
  }, [theme.background, composedBackground, isEmpire, isTreeReady, theme.backgroundTexture]);
  const layoutSettings = useMemo(() => {
    const base = {
      horizontalSpacing: 235,
      baseVerticalSpacing: 150,
      pledgeVerticalSpacing: 130,
      multiChildCompression: 0.9,
      siblingPadding: 36,
      prongDropFactor: 1.12,
    };

    if (isEmpire) {
      return {
        ...base,
        horizontalSpacing: 220,
        multiChildCompression: 0.86,
        siblingPadding: 30,
      };
    }

    if (isPower) {
      return {
        ...base,
        siblingPadding: 42,
      };
    }

    if (isGreed) {
      return {
        ...base,
        siblingPadding: 34,
      };
    }

    if (isPride) {
      return {
        ...base,
        siblingPadding: 40,
      };
    }

    if (isWolfpack) {
      return {
        ...base,
        siblingPadding: 38,
      };
    }

    return base;
  }, [isEmpire, isPower, isGreed, isPride, isWolfpack]);

  const normalizeSearchValue = useCallback(
    (value) =>
      value
        ?.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '',
    [],
  );

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, id: Date.now() });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

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

  // Define renderNodeTemplate using useMemo to ensure it's always initialized with theme
  // This prevents "Cannot access uninitialized variable" errors in production
  const renderNodeTemplate = useMemo(() => {
    // Return a function that doesn't rely on closure - always uses theme param or fallback
    return (brother, themeParam, palette) => {
      // Always use themeParam if provided, otherwise use current theme, otherwise fallback
      const themeToUse = themeParam || theme || getThemeStyles('default');
      if (!themeToUse) {
        console.warn('renderNodeTemplate: No theme available, using fallback');
        return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
      }
    const rawPledge = brother.pledge_class || 'Unassigned';
    const pledgeLabel = rawPledge.toUpperCase();
    const statusLabel = statusLabelForBrother(brother);
    const classLabel = brother.graduation_year ? `Class of ${brother.graduation_year}` : null;
    const isPlaceholder = palette.isPlaceholder
      ? palette.isPlaceholder(brother)
      : !brother.name || /^unassigned/i.test(brother.name.trim());
    const isTransfer = brother.is_transfer === 1 && palette.supportsTransfer;
    const placeholderText = palette.placeholderText || 'Awaiting lineage assignment';
    const effectiveName = brother.name || 'Unassigned';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 190,
          whiteSpace: 'normal',
          color: palette.bodyColor,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '0.9px',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: 999,
              background: palette.badgeBg,
              color: palette.badgeColor,
              fontWeight: 600,
            }}
          >
            {pledgeLabel}
          </div>
          {isTransfer && (
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: palette.transferColor,
              }}
            >
              Transfer
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontFamily: themeToUse.titleFont,
              fontSize: palette.nameSize || '12px',
              letterSpacing: palette.nameTracking || '0.5px',
              lineHeight: 1.32,
              color: palette.nameColor,
            }}
          >
            {effectiveName}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: palette.statusColor,
              fontWeight: 500,
              letterSpacing: '0.3px',
              lineHeight: 1.4,
            }}
          >
            {statusLabel}
          </div>
          {classLabel && (
            <div
              style={{
                fontSize: '10px',
                color: palette.classColor,
                letterSpacing: '0.2px',
                lineHeight: 1.4,
              }}
            >
              {classLabel}
            </div>
          )}
          {isPlaceholder && (
            <div
              style={{
                fontSize: '10px',
                color: palette.placeholderColor || palette.statusColor,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              {placeholderText}
            </div>
          )}
        </div>
      </div>
    );
    };
  }, [theme]);

  const renderEmpireNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: '#24170b',
      badgeBg: 'rgba(147, 107, 28, 0.2)',
      badgeColor: '#5a3d16',
      transferColor: 'rgba(59, 43, 22, 0.6)',
      nameColor: '#24170b',
      statusColor: 'rgba(36, 23, 11, 0.9)',
      classColor: 'rgba(36, 23, 11, 0.75)',
      placeholderColor: 'rgba(147, 107, 28, 0.75)',
      supportsTransfer: false,
      nameSize: '13px',
      nameTracking: '0.4px',
    });
  }, [theme, renderNodeTemplate]);

  const renderPowerNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: '#fdf5dc',
      badgeBg: 'rgba(247, 227, 168, 0.24)',
      badgeColor: '#fef3d8',
      transferColor: 'rgba(247, 235, 206, 0.7)',
      nameColor: '#fef8e3',
      statusColor: 'rgba(250, 240, 210, 0.95)',
      classColor: 'rgba(246, 233, 196, 0.86)',
      placeholderColor: 'rgba(243, 220, 166, 0.8)',
      supportsTransfer: true,
    });
  }, [theme, renderNodeTemplate]);

  const renderGreedNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: '#0a2316',
      badgeBg: 'rgba(244, 217, 97, 0.28)',
      badgeColor: '#5b4811',
      transferColor: 'rgba(10, 31, 20, 0.6)',
      nameColor: '#182b1e',
      statusColor: 'rgba(10, 31, 20, 0.82)',
      classColor: 'rgba(10, 31, 20, 0.7)',
      placeholderColor: 'rgba(180, 214, 138, 0.85)',
      supportsTransfer: true,
    });
  }, [theme, renderNodeTemplate]);

  const renderWolfpackNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: '#1e2c45',
      badgeBg: 'rgba(156,184,234,0.28)',
      badgeColor: '#1e2c45',
      transferColor: 'rgba(33, 51, 82, 0.65)',
      nameColor: '#1e2c45',
      statusColor: 'rgba(24, 41, 68, 0.9)',
      classColor: 'rgba(24, 41, 68, 0.78)',
      placeholderColor: 'rgba(156,184,234,0.82)',
      supportsTransfer: true,
    });
  }, [theme, renderNodeTemplate]);

  const renderPrideNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: '#fbf7ee',
      badgeBg: 'rgba(212, 175, 126, 0.24)',
      badgeColor: '#f1d0a0',
      transferColor: 'rgba(212, 175, 126, 0.75)',
      nameColor: '#f6d9a5',
      statusColor: 'rgba(248, 245, 239, 0.85)',
      classColor: 'rgba(248, 245, 239, 0.72)',
      placeholderColor: 'rgba(212, 175, 126, 0.78)',
      supportsTransfer: true,
      nameTracking: '0.6px',
    });
  }, [theme, renderNodeTemplate]);

  const renderDefaultNodeContent = useCallback((brother) => {
    if (!theme || !renderNodeTemplate) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    return renderNodeTemplate(brother, theme, {
      bodyColor: theme.nodeText || '#3b2b16',
      badgeBg: hexToRgba(theme.accent || '#c9a857', 0.22),
      badgeColor: theme.nodeText || '#3b2b16',
      transferColor: 'rgba(80,80,80,0.65)',
      nameColor: theme.nodeText || '#3b2b16',
      statusColor: hexToRgba(theme.nodeText || '#3b2b16', 0.82),
      classColor: hexToRgba(theme.nodeText || '#3b2b16', 0.7),
      placeholderColor: hexToRgba(theme.accent || '#c9a857', 0.7),
      supportsTransfer: true,
    });
  }, [theme, renderNodeTemplate]);
  const { setCenter, getViewport } = reactFlowInstance;

  /**
   * Loads family tree data (brothers and relationships) from the API
   * 
   * @async
   * @function loadTreeData
   * @throws {Error} If API request fails
   */
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsTreeReady(false); // Reset fade-in state when loading new family
      const response = await familiesApi.getTree(family.id);
      setBrothers(response.data.brothers || []);
      setRelationships(response.data.relationships || []);
    } catch (error) {
      console.error('Failed to load tree data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load family tree');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family.id]); // Only depend on family.id to prevent infinite loops

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  const pledgeSummary = useMemo(() => {
    const classes = new Set();
    let placeholderCount = 0;
    brothers.forEach((brother) => {
      if (!brother?.name || /^unassigned/i.test(brother.name.trim())) {
        placeholderCount += 1;
      }
      if (brother?.pledge_class) {
        classes.add(brother.pledge_class.trim().toUpperCase());
      }
    });
    return {
      totalBrothers: brothers.length,
      uniquePledgeClasses: classes.size,
      placeholderCount,
    };
  }, [brothers]);

  /**
   * Calculates tree layout using BFS algorithm and creates React Flow nodes/edges
   * 
   * Organizes brothers into hierarchical levels based on relationships:
   * - Level 0: Root nodes (no big brother)
   * - Level N: Nodes N levels deep from root
   * 
   * Positions nodes in a grid layout with configurable spacing.
   * 
   * @effect
   * @dependencies {Array} brothers - List of all brothers
   * @dependencies {Array} relationships - Parent-child relationships
   * @dependencies {Object} theme - Theme configuration for styling
   */
  useEffect(() => {
    // Don't clear nodes/edges if loading - wait for data
    if (!loading && brothers.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    if (brothers.length === 0) {
      return; // Still loading, don't process yet
    }
    
    // Build relationship structure: parent -> children
    const relationshipsMap = new Map(); // little_id -> big_id
    const childrenMap = new Map(); // big_id -> [little_ids]
    
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
      relationshipsMap.set(rel.little_id, rel.big_id);
        if (!childrenMap.has(rel.big_id)) {
          childrenMap.set(rel.big_id, []);
        }
        childrenMap.get(rel.big_id).push(rel.little_id);
      }
    });

    // Layout algorithm: Binary tree vertical layout
    const layoutNodes = [];
    const layoutEdges = [];
    const nodePositions = new Map();
    const subtreeWidthCache = new Map();
    
    // Node dimensions
    const nodeWidth = 180;
    const nodeHeight = 100;
    const {
      horizontalSpacing,
      baseVerticalSpacing,
      pledgeVerticalSpacing,
      multiChildCompression,
      siblingPadding,
      prongDropFactor,
    } = layoutSettings;

    /**
     * Recursively calculates the width needed for a subtree
     * @param {number} rootId - Root of the subtree
     * @returns {number} Width needed for this subtree
     */
    const getSubtreeWidth = (rootId) => {
      if (subtreeWidthCache.has(rootId)) {
        return subtreeWidthCache.get(rootId);
      }

      const children = childrenMap.get(rootId) || [];
      if (children.length === 0) {
        subtreeWidthCache.set(rootId, horizontalSpacing);
        return horizontalSpacing;
      }

      const childWidths = children.map((childId) => getSubtreeWidth(childId));
      const compression =
        multiChildCompression < 1 && children.length >= 3
          ? multiChildCompression
          : 1;

      let totalWidth;
      if (children.length === 3) {
        const pad = siblingPadding || horizontalSpacing * 0.25;
        const left = childWidths[0] * compression;
        const center = childWidths[1] * compression;
        const right = childWidths[2] * compression;
        totalWidth = left + center + right + pad * 2;
      } else {
        totalWidth =
          childWidths.reduce((sum, width) => sum + width, 0) * compression +
          Math.max(children.length - 1, 0) * siblingPadding;
      }
      const width = Math.max(totalWidth, horizontalSpacing);

      subtreeWidthCache.set(rootId, width);
      return width;
    };

    /**
     * Recursively positions nodes in a binary tree layout
     * @param {number} nodeId - ID of the node to position
     * @param {number} x - X position (center of subtree)
     * @param {number} y - Y position (generation level)
     */
    const positionNode = (nodeId, x, y) => {
      nodePositions.set(nodeId, { x, y });
      
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) {
        return;
      }

      // Calculate positions for children
      const childWidthsRaw = children.map((childId) => getSubtreeWidth(childId));
      const compression =
        multiChildCompression < 1 && children.length >= 3
          ? multiChildCompression
          : 1;

      if (children.length === 3) {
        const compressedWidths = childWidthsRaw.map((width) => width * compression);
        const pad = siblingPadding || horizontalSpacing * 0.25;

        const leftWidth = compressedWidths[0];
        const centerWidth = compressedWidths[1];
        const rightWidth = compressedWidths[2];

        const leftX = x - (leftWidth / 2 + centerWidth / 2 + pad);
        const rightX = x + (rightWidth / 2 + centerWidth / 2 + pad);
        const outerY = y + baseVerticalSpacing;
        const centerY = y + baseVerticalSpacing * (prongDropFactor || 1.12);

        positionNode(children[0], leftX, outerY);
        positionNode(children[2], rightX, outerY);
        positionNode(children[1], x, centerY);
        return;
      }

      const totalWidth =
        childWidthsRaw.reduce((sum, width) => sum + width, 0) * compression +
        Math.max(children.length - 1, 0) * siblingPadding;
      const startX = x - totalWidth / 2;

      let accumulatedWidth = 0;
      children.forEach((childId, index) => {
        const width = childWidthsRaw[index] * compression;
        const pad = index > 0 ? siblingPadding : 0;
        accumulatedWidth += pad;
        const childX = startX + accumulatedWidth + width / 2;
        positionNode(childId, childX, y + baseVerticalSpacing);
        accumulatedWidth += width;
      });
    };

    // Find root nodes (nodes with no big_id)
    const rootNodes = brothers.filter(b => {
      const bigId = relationshipsMap.get(b.id);
      return !bigId || !brothers.some(br => br.id === bigId);
    });

    // Position root nodes at the top
    if (rootNodes.length > 0) {
      const totalWidth = rootNodes.reduce((sum, root) => {
        const rootId = root.id;
        const children = childrenMap.get(rootId) || [];
        return sum + (children.length > 0 ? getSubtreeWidth(rootId) : horizontalSpacing);
      }, 0);
      
      let currentX = -totalWidth / 2;
      
      rootNodes.forEach((root) => {
        const rootId = root.id;
        const children = childrenMap.get(rootId) || [];
        const subtreeWidth = children.length > 0 ? getSubtreeWidth(rootId) : horizontalSpacing;
        const rootX = currentX + subtreeWidth / 2;
        positionNode(rootId, rootX, 0);
        currentX += subtreeWidth;
      });
    } else {
      // No roots found, just position all nodes in a simple grid
    const levelMap = new Map();
    brothers.forEach(b => {
        const bigId = relationshipsMap.get(b.id);
        const level = bigId ? 1 : 0;
      if (!levelMap.has(level)) levelMap.set(level, []);
      levelMap.get(level).push(b.id);
    });

      levelMap.forEach((nodeIds, level) => {
        const spacing = horizontalSpacing;
        const startX = -((nodeIds.length - 1) * spacing) / 2;
        nodeIds.forEach((nodeId, index) => {
          nodePositions.set(nodeId, { x: startX + index * spacing, y: level * baseVerticalSpacing });
        });
      });
    }
    if (isEmpire) {
      brothers.forEach((brother) => {
        const children = childrenMap.get(brother.id) || [];
        if (children.length === 0) {
          return;
        }
        const childXs = children
          .map((childId) => nodePositions.get(childId))
          .filter(Boolean)
          .map((pos) => pos.x);
        if (childXs.length === 0) {
          return;
        }
        const avgX = childXs.reduce((sum, x) => sum + x, 0) / childXs.length;
        const currentPos = nodePositions.get(brother.id);
        if (currentPos) {
          nodePositions.set(brother.id, { ...currentPos, x: avgX });
        }
      });
    }

    const pledgeOrder = [
      'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega',
      'alpha alpha','alpha beta','alpha gamma','alpha delta','alpha epsilon','alpha zeta','alpha eta','alpha theta','alpha iota','alpha kappa','alpha lambda','alpha mu','alpha nu','alpha xi','alpha omicron','alpha pi','alpha rho','alpha sigma','alpha tau','alpha upsilon','alpha phi','alpha chi','alpha psi','alpha omega',
    ];
    const pledgeIndex = new Map(pledgeOrder.map((pledge, idx) => [pledge, idx]));
    const pledgeSynonyms = {
      'alphabeta': 'alpha beta',
      'alpha beta': 'alpha beta',
      'alpha-beta': 'alpha beta',
      'alpha gamma': 'alpha gamma',
      'alphagamma': 'alpha gamma',
      'alphazeta': 'alpha zeta',
      'alpha zeta': 'alpha zeta',
      'alphatheta': 'alpha theta',
      'alpha theta': 'alpha theta',
      'alpha eta': 'alpha eta',
      'alphaeta': 'alpha eta',
      'alpha iota': 'alpha iota',
      'alphaiota': 'alpha iota',
      'alpha lambda': 'alpha lambda',
      'alphalambda': 'alpha lambda',
      'alpha mu': 'alpha mu',
      'alphamu': 'alpha mu',
      'alpha nu': 'alpha nu',
      'alphan u': 'alpha nu',
      'alpha xi': 'alpha xi',
      'alphaxi': 'alpha xi',
      'alpha omicron': 'alpha omicron',
      'alphaomicron': 'alpha omicron',
      'alpha pi': 'alpha pi',
      'alphapi': 'alpha pi',
      'alpha rho': 'alpha rho',
      'alpharho': 'alpha rho',
      'alpha sigma': 'alpha sigma',
      'alphasigma': 'alpha sigma',
      'alpha tau': 'alpha tau',
      'alphatau': 'alpha tau',
      'alpha upsilon': 'alpha upsilon',
      'alphaupsilon': 'alpha upsilon',
      'alpha phi': 'alpha phi',
      'alphaphi': 'alpha phi',
      'alpha chi': 'alpha chi',
      'alphachi': 'alpha chi',
      'alpha psi': 'alpha psi',
      'alphapsi': 'alpha psi',
      'alpha omega': 'alpha omega',
      'alphaomega': 'alpha omega',
    };

    const letterToGreek = {
      a: 'alpha',
      b: 'beta',
      g: 'gamma',
      d: 'delta',
      e: 'epsilon',
      z: 'zeta',
      h: 'eta',
      t: 'theta',
      i: 'iota',
      k: 'kappa',
      l: 'lambda',
      m: 'mu',
      n: 'nu',
      x: 'xi',
      o: 'omicron',
      p: 'pi',
      r: 'rho',
      s: 'sigma',
      u: 'upsilon',
      f: 'phi',
      c: 'chi',
      y: 'psi',
      w: 'omega',
    };

    const normalizePledge = (value) =>
      value
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const expandDoubleLetter = (normalized) => {
      const compact = normalized.replace(/\s+/g, '');
      if (compact.length === 2) {
        const first = letterToGreek[compact[0]];
        const second = letterToGreek[compact[1]];
        if (first && second) {
          return `${first} ${second}`;
        }
      }
      return null;
    };

    const getPledgeLevel = (pledgeClass, fallback) => {
      if (!pledgeClass || typeof pledgeClass !== 'string') return fallback;
      const normalized = normalizePledge(pledgeClass);
      if (!normalized) return fallback;

      const synonym = pledgeSynonyms[normalized];
      const canonical = synonym || normalized;

      if (pledgeIndex.has(canonical)) {
        return pledgeIndex.get(canonical);
      }

      const expanded = expandDoubleLetter(canonical);
      if (expanded && pledgeIndex.has(expanded)) {
        return pledgeIndex.get(expanded);
      }

      return fallback;
    };

    const adjustedPositions = new Map();
    const queue = [];
    brothers.forEach((brother) => {
      const pos = nodePositions.get(brother.id);
      if (pos) {
        const depthLevel = Math.floor(pos.y / baseVerticalSpacing);
        const pledgeLevel = getPledgeLevel(brother.pledge_class, depthLevel);
        adjustedPositions.set(brother.id, {
          ...pos,
          depthLevel,
          pledgeLevel,
        });
      }
    });

    const enforceHierarchy = (nodeId) => {
      const current = adjustedPositions.get(nodeId);
      if (!current) return;
      const children = childrenMap.get(nodeId) || [];
      children.forEach((childId) => {
        const childPos = adjustedPositions.get(childId);
        if (!childPos) return;
        if (childPos.pledgeLevel <= current.pledgeLevel) {
          childPos.pledgeLevel = current.pledgeLevel + 1;
        }
        enforceHierarchy(childId);
      });
    };

    brothers.forEach((brother) => {
      if (!relationshipsMap.get(brother.id)) {
        enforceHierarchy(brother.id);
      }
    });

    const levelRemap = new Map();
    Array.from(new Set(Array.from(adjustedPositions.values()).map(({ pledgeLevel }) => pledgeLevel)))
      .sort((a, b) => a - b)
      .forEach((level, idx) => levelRemap.set(level, idx));

    brothers.forEach((brother) => {
      const info = adjustedPositions.get(brother.id);
      if (!info) return;
      const remappedLevel = levelRemap.get(info.pledgeLevel) ?? info.pledgeLevel;
      nodePositions.set(brother.id, {
        x: info.x,
        y: remappedLevel * pledgeVerticalSpacing,
      });
    });

    // Create React Flow nodes
    brothers.forEach(brother => {
      let position = nodePositions.get(brother.id);
      const status = brother.status === 'studying' ? 'studying' : 'graduated';
      const isTransfer = brother.is_transfer === 1;
      
      const nodeStyle = {
        background: status === 'studying' ? theme.nodeStudying : theme.nodeGraduated,
        color: theme.nodeText,
        border: `2px solid ${theme.nodeBorder}`,
        borderRadius: `${theme.nodeRadius || 8}px`,
        padding: '10px',
        width: nodeWidth,
        minHeight: nodeHeight,
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
      };

      // Per-family refinements based on family-tree-corrected.md specifications
      if (familyKey === 'empire') {
        nodeStyle.background = '#fff6e8';
        nodeStyle.border = '1.6px solid rgba(145, 104, 29, 0.75)';
        nodeStyle.color = '#24170b';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '14px 16px 14px 26px';
        nodeStyle.minHeight = '108px';
        nodeStyle.boxShadow = '0 20px 36px rgba(58, 33, 3, 0.22), 0 8px 18px rgba(201, 168, 87, 0.26)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(201,168,87,0.68) 0px, rgba(201,168,87,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(201,168,87,0.24), transparent 55%)';
        nodeStyle.backgroundSize = '9px 100%, 100% 100%';
        nodeStyle.backgroundRepeat = 'no-repeat, no-repeat';
        nodeStyle.backgroundPosition = 'left top, center';
      } else if (familyKey === 'power') {
        nodeStyle.background = 'linear-gradient(135deg, rgba(20, 38, 60, 0.92) 0%, rgba(10, 22, 38, 0.85) 100%)';
        nodeStyle.border = '1.5px solid rgba(245, 210, 131, 0.85)';
        nodeStyle.color = '#fdf5dc';
        nodeStyle.borderRadius = '6px';
        nodeStyle.padding = '14px 18px 14px 26px';
        nodeStyle.minHeight = '108px';
        nodeStyle.boxShadow = '0 18px 34px rgba(8, 16, 24, 0.55), 0 6px 16px rgba(245, 210, 131, 0.3)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(243,220,166,0.75) 0px, rgba(243,220,166,0.75) 9px, transparent 9px)';
        nodeStyle.backgroundSize = '9px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'greed') {
        nodeStyle.background = 'linear-gradient(135deg, rgba(246, 252, 244, 0.96) 0%, rgba(233, 247, 230, 0.92) 100%)';
        nodeStyle.border = '1.6px solid rgba(180, 214, 138, 0.9)';
        nodeStyle.color = '#0a2316';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '12px 16px 12px 24px';
        nodeStyle.minHeight = '104px';
        nodeStyle.boxShadow = '0 16px 32px rgba(9,53,32,0.28), 0 6px 16px rgba(244, 217, 97, 0.26)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(244,217,97,0.55) 0px, rgba(244,217,97,0.55) 8px, transparent 8px)';
        nodeStyle.backgroundSize = '8px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'wolfpack') {
        nodeStyle.background = 'linear-gradient(135deg, rgba(248,252,255,0.98) 0%, rgba(234,243,255,0.94) 100%)';
        nodeStyle.border = '1.6px solid rgba(156, 184, 234, 0.85)';
        nodeStyle.color = '#1f2f49';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '13px 16px 13px 24px';
        nodeStyle.minHeight = '106px';
        nodeStyle.boxShadow = '0 18px 34px rgba(41, 62, 96, 0.28), 0 6px 18px rgba(20, 33, 54, 0.2)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(156,184,234,0.65) 0px, rgba(156,184,234,0.65) 9px, transparent 9px)';
        nodeStyle.backgroundSize = '9px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'pride') {
        nodeStyle.background = '#231d17';
        nodeStyle.border = `1.8px solid rgba(212,175,126,0.82)`;
        nodeStyle.color = '#fbf7ee';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '14px 18px 14px 28px';
        nodeStyle.minHeight = '110px';
        nodeStyle.boxShadow = '0 14px 30px rgba(0,0,0,0.45), 0 6px 16px rgba(212,175,126,0.28)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(212,175,126,0.55) 0px, rgba(212,175,126,0.55) 10px, transparent 10px)';
        nodeStyle.backgroundSize = '10px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      }

      const isPlaceholderNode = !brother.name || /^unassigned/i.test(brother.name.trim());
      if (isPlaceholderNode) {
        const accentColor = hexToRgba(theme.accent || '#c9a857', 0.75);
        const overlay = hexToRgba(theme.accent || '#c9a857', 0.12);
        const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
        nodeStyle.border = `1.8px dashed ${accentColor}`;
        nodeStyle.boxShadow = `${existingShadow}0 0 0 1px ${hexToRgba(theme.accent || '#c9a857', 0.18)} inset`;
        nodeStyle.backgroundImage = `${nodeStyle.backgroundImage ? `${nodeStyle.backgroundImage},` : ''}repeating-linear-gradient(135deg, ${overlay} 0 8px, transparent 8px 16px)`;
      }
      const isHighlightedNode = highlightBrotherId === String(brother.id);
      if (isHighlightedNode) {
        const accent = theme.accent || '#c9a857';
        const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
        nodeStyle.border = `2px solid ${accent}`;
        nodeStyle.boxShadow = `${existingShadow}0 0 0 4px ${hexToRgba(accent, 0.3)}`;
      }
      if (lineageHighlightSet.has(String(brother.id))) {
        const accent = hexToRgba(theme.accent || '#c9a857', 0.25);
        const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
        nodeStyle.boxShadow = `${existingShadow}0 0 0 3px ${accent}`;
        nodeStyle.filter = 'brightness(1.05)';
      }

      // Build node label based on family theme
      let nodeLabel;
      if (!theme) {
        // Fallback if theme not ready
        nodeLabel = <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
      } else {
        try {
          switch (familyKey) {
            case 'empire':
              nodeLabel = renderEmpireNodeContent(brother);
              break;
            case 'power':
              nodeLabel = renderPowerNodeContent(brother);
              break;
            case 'greed':
              nodeLabel = renderGreedNodeContent(brother);
              break;
            case 'wolfpack':
              nodeLabel = renderWolfpackNodeContent(brother);
              break;
            case 'pride':
              nodeLabel = renderPrideNodeContent(brother);
              break;
            default:
              nodeLabel = renderDefaultNodeContent(brother);
          }
        } catch (error) {
          console.warn('Error rendering node content:', error);
          nodeLabel = <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
        }
      }

      // Add node with position (fallback to 0,0 if not calculated)
      layoutNodes.push({
        id: String(brother.id),
        data: {
          label: nodeLabel,
          brother: brother,
        },
        position: position || { x: 0, y: 0 },
        style: nodeStyle,
      });
    });

    // capture layout bounds for dynamic viewport
    if (layoutNodes.length) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      layoutNodes.forEach((node) => {
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        minY = Math.min(minY, node.position.y);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });
      treeBoundsRef.current = {
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    // Create edges - only if both nodes exist
    // Use a more visible edge color for lineage
    const edgeColor = theme.edgeColor || theme.accent || '#666666';
    // Make edges thicker and more visible for clear lineage
    const edgeStrokeWidth = 4;
    
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
        // Verify both nodes exist in the brothers array
        const bigExists = brothers.some(b => b.id === rel.big_id);
        const littleExists = brothers.some(b => b.id === rel.little_id);
        
        if (bigExists && littleExists) {
          const childCount = (childrenMap.get(rel.big_id) || []).length;
          const isSingleChild = childCount <= 1;
          const edgeType = isSingleChild ? 'step' : (theme.edgeType || 'smoothstep');
          const isLineageEdge =
            lineageHighlightSet.has(String(rel.big_id)) && lineageHighlightSet.has(String(rel.little_id));
          
          const edge = {
          id: `e${rel.big_id}-${rel.little_id}`,
          source: String(rel.big_id),
          target: String(rel.little_id),
            type: edgeType,
            animated: theme.edgeAnimated !== undefined ? theme.edgeAnimated : false,
            style: {
              stroke: isLineageEdge ? hexToRgba(theme.accent || edgeColor, 0.9) : edgeColor,
              strokeWidth: isLineageEdge ? edgeStrokeWidth + 2 : edgeStrokeWidth + 1,
              opacity: 0.97,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
              borderRadius: isSingleChild ? 16 : undefined,
            },
            markerEnd: MarkerType.ArrowClosed,
            data: {
              isSingleChild,
            },
          };
          layoutEdges.push(edge);
        }
      }
    });

    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brothers, relationships, familyKey, layoutSettings, highlightBrotherId, lineageHighlightSet]);

  /**
   * Handles node click events - selects brother and smoothly zooms to node
   * 
   * @param {Object} event - React Flow node click event
   * @param {Object} node - React Flow node object with position and data
   * @param {Object} node.data.brother - Brother data object
   * @param {Object} node.position - Node position {x, y}
   */
  const onNodeClick = useCallback((event, node) => {
    // Save current viewport before opening modal
    try {
      const currentViewport = getViewport();
      setViewportBeforeModal(currentViewport);
    } catch (e) {
      // If viewport not available, that's okay
    }
    
    setSelectedBrother(node.data.brother);
    setIsModalOpen(true);
    // Smoothly center and zoom to the clicked node
    const { x, y } = node.position;
    const width = node.style?.width || 180;
    const height = node.style?.minHeight || 80;
    const zoom = 1.4; // tasteful zoom level
    setCenter(x + width / 2, y + height / 2, {
      zoom,
      duration: 500,
    });
  }, [setCenter, getViewport]);

  const onPaneClick = useCallback((event) => {
    if (event.target.classList.contains('react-flow__pane')) {
      setSelectedBrother(null);
      setIsModalOpen(false);
      // Don't close add form on pane click - let user finish adding
    }
  }, []);

  const restorePointerEvents = useCallback(() => {
    const wrapper = document.querySelector('.react-flow');
    const pane = document.querySelector('.react-flow__pane');
    if (wrapper) {
      wrapper.style.pointerEvents = 'auto';
    }
    if (pane) {
      pane.style.pointerEvents = 'auto';
    }
  }, []);

  const closeProfile = useCallback(
    (restoreViewport = true) => {
      if (restoreViewport) {
        const targetViewport = viewportBeforeModal || initialViewportRef.current;
        try {
          if (targetViewport) {
            reactFlowInstance.setViewport(targetViewport, { duration: 300 });
          } else {
            fitTreeView(isEmpire ? 0.15 : undefined, 400);
          }
        } catch (e) {
          // ignore viewport restore failures
        }
      }

      restorePointerEvents();
      setSelectedBrother(null);
      setIsModalOpen(false);
      setViewportBeforeModal(null);
    },
    [
      viewportBeforeModal,
      reactFlowInstance,
      isEmpire,
      restorePointerEvents,
      fitTreeView,
    ],
  );

  // Effect to restore ReactFlow interactions after modal closes
  useEffect(() => {
    if (!isModalOpen && !selectedBrother) {
      // Modal is closed, ensure ReactFlow is interactive
      // The viewport restoration in onClose should handle most cases,
      // but we'll ensure pointer events are correct as a fallback
      const restoreInteractions = () => {
        restorePointerEvents();
      };
      
      // Small delay to ensure modal is fully unmounted
      setTimeout(restoreInteractions, 100);
    }
  }, [isModalOpen, selectedBrother, restorePointerEvents]);

  const handleAddNodeClick = useCallback((event, node) => {
    if (event) event.stopPropagation();
    const brother = node?.data?.brother || node;
    setAddFormParent(brother);
    setShowAddForm(true);
  }, []);

  const handleNodeUpdate = useCallback(() => {
    closeProfile(true);
    loadTreeData();
  }, [closeProfile, loadTreeData]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (initialViewportRef.current) return;
    try {
      initialViewportRef.current = reactFlowInstance.getViewport();
    } catch (e) {
      initialViewportRef.current = null;
    }
  }, [nodes, reactFlowInstance]);

  useEffect(() => {
    const targetViewport = defaultViewport;
    try {
      reactFlowInstance.setViewport(targetViewport, { duration: 300 });
    } catch {
      // ignore viewport errors
    }
    initialViewportRef.current = targetViewport;
    hasFitRef.current = false;
  }, [family.id, defaultViewport, reactFlowInstance]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isEmpire) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        fitTreeView(isEmpire ? 0.15 : undefined, 450);
        return;
      }

      const adjustZoom = (direction) => {
        try {
          const currentViewport = reactFlowInstance.getViewport();
          const nextZoom = Math.max(
            minZoom,
            Math.min(maxZoom, currentViewport.zoom * direction),
          );
          reactFlowInstance.zoomTo(nextZoom, 200);
        } catch {
          // ignore
        }
      };

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        adjustZoom(0.9);
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        adjustZoom(1.1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmpire, reactFlowInstance, minZoom, maxZoom, fitTreeView]);

  useEffect(() => {
    if (!isTreeReady || nodes.length === 0 || hasFitRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      try {
        fitTreeView();
        hasFitRef.current = true;
      } catch (err) {
        console.warn('Failed to fit view:', err);
      }
    });
  }, [isTreeReady, nodes, reactFlowInstance, isEmpire, fitTreeView]);

  const fitPaddingForBounds = useCallback(() => {
    const { width, height } = treeBoundsRef.current;
    const longestSide = Math.max(width, height);
    if (!longestSide || !Number.isFinite(longestSide)) {
      return 0.25;
    }

    if (longestSide < 600) return 0.42;
    if (longestSide < 1200) return 0.28;
    if (longestSide < 2000) return 0.22;
    return 0.18;
  }, []);

  const fitTreeView = useCallback(
    (paddingOverride, duration = 500) => {
      try {
        reactFlowInstance.fitView({
          padding: paddingOverride ?? fitPaddingForBounds(),
          duration,
        });
      } catch (err) {
        console.warn('fitView failed:', err);
      }
    },
    [fitPaddingForBounds, reactFlowInstance],
  );

  // Remove loading state - tree will fade in instead

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="text-center container" style={{ maxWidth: '32rem', padding: 'var(--space-6)' }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'var(--text-3xl)',
              fontFamily: 'var(--font-display)',
              // WOLFPACK text should always be white
              color: familyKey === 'wolfpack' ? '#ffffff' : (theme.accent || 'var(--primary)'),
              marginBottom: 'var(--space-4)',
            }}
          >
            {family.name} Family Tree
          </h2>
          <p
            className="mb-6"
            style={{
              fontSize: 'var(--text-lg)',
              color: theme.nodeText || 'var(--text-on-dark)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {error}
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--space-4)' }}>
            <button onClick={loadTreeData} className="btn btn-primary">
              Retry
            </button>
            {onChangeFamily && (
              <button onClick={onChangeFamily} className="btn btn-secondary">
                Back to Families
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no brothers yet (only show if not loading and actually empty)
  if (!loading && brothers.length === 0) {
    return (
      <>
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="text-center container" style={{ maxWidth: '32rem', padding: 'var(--space-6)' }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'var(--text-3xl)',
              fontFamily: 'var(--font-display)',
              // WOLFPACK text should always be white
              color: familyKey === 'wolfpack' ? '#ffffff' : (theme.accent || 'var(--primary)'),
              marginBottom: 'var(--space-4)',
            }}
          >
            {family.name} Family Tree
          </h2>
          <p
            className="mb-6"
            style={{
              fontSize: 'var(--text-lg)',
              color: theme.nodeText || 'var(--text-on-dark)',
              marginBottom: 'var(--space-6)',
            }}
          >
              This family tree is empty. Contact an administrator to add brothers to this family.
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--space-4)' }}>
            {onChangeFamily && (
              <button 
                onClick={onChangeFamily} 
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.accent,
                  borderColor: hexToRgba(theme.accent, 0.4),
                }}
              >
                Back to Families
              </button>
            )}
          </div>
        </div>
      </div>
        {/* Add functionality removed - site is read-only */}
      </>
    );
  }

  const focusBrotherNode = useCallback(
    (brotherId) => {
      const targetNode = nodes.find((node) => node.id === String(brotherId));
      if (!targetNode) {
        return false;
      }
      const estimatedWidth = targetNode.style?.width || targetNode.style?.minWidth || 200;
      const estimatedHeight = targetNode.style?.minHeight || targetNode.style?.height || 110;
      try {
        reactFlowInstance.setCenter(
          targetNode.position.x + estimatedWidth / 2,
          targetNode.position.y + estimatedHeight / 2,
          {
            zoom: 1.15,
            duration: 600,
          },
        );
      } catch (error) {
        console.warn('Failed to center node:', error);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightBrotherId(String(brotherId));
      highlightTimeoutRef.current = setTimeout(() => setHighlightBrotherId(null), 2600);
      if (lineageHighlightMode !== 'off') {
        setLineageSourceId(String(brotherId));
      }
      return true;
    },
    [nodes, reactFlowInstance, lineageHighlightMode],
  );

  const handleSearchSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const query = searchTerm.trim();
      if (!query) {
        showToast('Enter a name to search.');
        return;
      }
      const normalizedQuery = normalizeSearchValue(query);
      setIsSearching(true);
      try {
        updateIndexWithFamily(family.id, family.name, brothers);
        await buildGlobalIndex();
        const matches = searchIndexRef.current.filter((entry) =>
          entry.normalized.includes(normalizedQuery),
        );
        if (matches.length === 0) {
          showToast('No member found across the archive.');
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
          if (target && focusBrotherNode(target.brother.id)) {
            showToast(`Centered on ${target.name}.`);
          } else {
            showToast('Found a match but could not center the node.');
          }
        } else {
          const target = chooseBestMatch(matches);
          if (target) {
            const familyName = target.familyName || 'another family';
            showToast(`Not in this family. Found in ${familyName}.`);
          } else {
            showToast('No member found across the archive.');
          }
        }
      } catch (error) {
        console.error('Search failed:', error);
        showToast('Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    },
    [searchTerm, showToast, normalizeSearchValue, updateIndexWithFamily, family.id, family.name, brothers, buildGlobalIndex, focusBrotherNode],
  );

  useEffect(() => {
    if (!family?.id) return;
    updateIndexWithFamily(family.id, family.name, brothers);
  }, [brothers, family.id, family.name, updateIndexWithFamily]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    },
    [],
  );

  const searchIsDark = ['power', 'pride', 'wolfpack'].includes(familyKey);
  const searchPalette = useMemo(
    () => ({
      background: searchIsDark ? 'rgba(20, 30, 46, 0.85)' : 'rgba(255, 255, 255, 0.92)',
      inputColor: searchIsDark ? '#f6edcf' : '#2b2314',
      border: hexToRgba(theme.accent || '#c9a857', 0.35),
      buttonBg: theme.accent || '#c9a857',
      buttonText: searchIsDark ? '#1c2635' : '#2b2314',
    }),
    [familyKey, theme.accent, searchIsDark],
  );

  const handleExportTree = useCallback(async () => {
    setIsPreparingExport(true);
    showToast('Preparing export…');
    
    try {
      // Fit view to show entire tree
      fitTreeView();
      
      // Wait for view to settle
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add print-specific class to body for print styles
      document.body.classList.add('printing-tree');
      
      // Trigger print dialog
      window.print();
      
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing-tree');
        setIsPreparingExport(false);
        showToast('Export ready. Use browser print dialog to save as PDF.');
      }, 100);
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.');
      setIsPreparingExport(false);
    }
  }, [fitTreeView, showToast]);

  const childMap = useMemo(() => {
    const map = new Map();
    relationships.forEach((rel) => {
      if (!rel.big_id || !rel.little_id) return;
      const key = String(rel.big_id);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(String(rel.little_id));
    });
    return map;
  }, [relationships]);

  const parentMap = useMemo(() => {
    const map = new Map();
    relationships.forEach((rel) => {
      if (!rel.big_id || !rel.little_id) return;
      map.set(String(rel.little_id), String(rel.big_id));
    });
    return map;
  }, [relationships]);

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

  const milestoneMarkers = useMemo(() => {
    if (!isTreeReady || !nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return [];
    }
    
    try {
      // Group nodes by pledge class and find their average Y position
      const pledgeGroups = new Map();
      nodes.forEach(node => {
        if (!node || !node.data || !node.data.brother) return;
        const pledgeClass = node.data.brother.pledge_class;
        if (pledgeClass && node.position && typeof node.position.y === 'number') {
          if (!pledgeGroups.has(pledgeClass)) {
            pledgeGroups.set(pledgeClass, []);
          }
          pledgeGroups.get(pledgeClass).push(node.position.y);
        }
      });

      if (pledgeGroups.size === 0) return [];

      // Calculate average Y for each pledge class
      return Array.from(pledgeGroups.entries())
        .map(([pledgeClass, yPositions]) => {
          if (!yPositions || yPositions.length === 0) return null;
          const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
          return {
            pledgeClass: String(pledgeClass || '').toUpperCase(),
            avgY: avgY,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.avgY - b.avgY)
        .slice(0, 8); // Limit to 8 most prominent markers
    } catch (error) {
      console.warn('Error calculating milestone markers:', error);
      return [];
    }
  }, [isTreeReady, nodes]);

  useEffect(() => {
    if (lineageHighlightMode === 'off') {
      setLineageSourceId(null);
      return;
    }
    if (selectedBrother) {
      setLineageSourceId(String(selectedBrother.id));
    }
  }, [lineageHighlightMode, selectedBrother]);

  return (
    <div className="w-full relative" style={containerStyle}>
      <form
        onSubmit={handleSearchSubmit}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: searchPalette.background,
          border: `1px solid ${searchPalette.border}`,
          borderRadius: 999,
          padding: '6px 12px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search brothers"
          aria-label="Search brothers"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: 180,
            color: searchPalette.inputColor,
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          disabled={isSearching || !searchTerm.trim()}
          style={{
            background: searchPalette.buttonBg,
            color: searchPalette.buttonText,
            border: 'none',
            borderRadius: 999,
            padding: '6px 12px',
            fontWeight: 600,
            fontSize: '12px',
            cursor: isSearching ? 'wait' : 'pointer',
            opacity: isSearching ? 0.65 : 1,
            transition: 'transform 0.2s ease',
          }}
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </form>

      <div
      style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <select
          value={lineageHighlightMode}
          onChange={(event) => setLineageHighlightMode(event.target.value)}
          style={{
            background: searchPalette.background,
            color: searchPalette.inputColor,
            border: `1px solid ${searchPalette.border}`,
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            appearance: 'none',
          }}
        >
          <option value="off">Highlight: Off</option>
          <option value="ancestors">Highlight: Ancestors</option>
          <option value="descendants">Highlight: Descendants</option>
          <option value="both">Highlight: Lineage</option>
        </select>
        <button
          type="button"
          onClick={handleExportTree}
          disabled={isPreparingExport}
          style={{
            background: theme.accent || '#c9a857',
            color: familyKey === 'power' || familyKey === 'pride' ? '#1f1f1f' : '#2b2314',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: '12px',
            cursor: isPreparingExport ? 'wait' : 'pointer',
            boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
            opacity: isPreparingExport ? 0.65 : 1,
          }}
        >
          {isPreparingExport ? 'Preparing…' : 'Export / Print'}
        </button>
      </div>

      {toast && (
        <div
          key={toast.id}
          style={{
            position: 'absolute',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            background: presentation.legend.panelBg,
            color: presentation.legend.textColor,
            border: presentation.legend.border,
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 12px 22px rgba(0,0,0,0.18)',
            zIndex: 12,
            pointerEvents: 'none',
            textTransform: 'none',
            letterSpacing: '0.02em',
            fontSize: '13px',
            fontWeight: 500,
            opacity: 0,
            animation: 'toastFadeIn 0.3s ease-out forwards, toastFadeOut 0.3s ease-in 3.7s forwards',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {toast.message}
        </div>
      )}
      {/* Add functionality removed - site is read-only. Use admin.html for adding brothers. */}
    <div
      style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: presentation.header.textColor,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          padding: '10px 24px 14px',
          background: presentation.header.panelBg,
          borderRadius: 18,
          boxShadow: presentation.header.shadow,
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: presentation.header.crestBg,
            color: presentation.header.crestColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: theme.titleFont,
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            border: `1px solid ${hexToRgba(presentation.accent, 0.4)}`,
          }}
        >
          {presentation.crestLetter}
        </span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8 }}>
            {presentation.subtitle}
          </div>
          <div
            style={{
              fontFamily: theme.titleFont,
              fontSize: '18px',
              letterSpacing: '0.25em',
              marginTop: 4,
            }}
          >
            {presentation.title}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          background: presentation.legend.panelBg,
          border: presentation.legend.border,
          color: presentation.legend.textColor,
          fontSize: '10px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          padding: '12px 16px',
          borderRadius: 12,
          pointerEvents: 'none',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {presentation.legend.title}
        </div>
        {presentation.legend.lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(presentation.legend.textColor, 0.25)}`,
            margin: '8px 0',
            opacity: 0.6,
          }}
        />
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Tree Summary</div>
        <div>{`${pledgeSummary.totalBrothers} brothers`}</div>
        <div>{`${pledgeSummary.uniquePledgeClasses} pledge classes`}</div>
        {pledgeSummary.placeholderCount > 0 && (
          <div>{`${pledgeSummary.placeholderCount} awaiting assignment`}</div>
        )}
        {selectedBrother && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: `1px solid ${hexToRgba(presentation.legend.textColor, 0.18)}`,
              textTransform: 'none',
              letterSpacing: '0.02em',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Selected</div>
            <div>{selectedBrother.name}</div>
            <div style={{ opacity: 0.7 }}>
              {selectedBrother.pledge_class || 'Unassigned'}
            </div>
          </div>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        style={{ 
          width: '100%', 
          height: '100%', 
          background: theme.background, 
          fontFamily: theme.bodyFont, 
          pointerEvents: isModalOpen ? 'none' : 'auto',
          zIndex: 1,
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={defaultViewport}
        minZoom={minZoom}
        maxZoom={maxZoom}
        panOnDrag={!isModalOpen}
        zoomOnScroll={!isModalOpen}
        zoomOnPinch={!isModalOpen}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={theme.backgroundGrid} variant={theme.backgroundVariant || 'dots'} />
        <Controls />
        <MiniMap 
          nodeColor={theme.minimapNode}
          style={{ backgroundColor: theme.minimapBg }}
        />
      </ReactFlow>

      {/* Milestone Markers - Pledge Class Guides */}
      {milestoneMarkers && Array.isArray(milestoneMarkers) && milestoneMarkers.length > 0 && theme && presentation && milestoneMarkers.map((marker, idx) => {
        if (!marker || typeof marker.avgY !== 'number') return null;
        if (!theme || !presentation) return null;
        
        try {
          const accentColor = hexToRgba(theme.accent || '#c9a857', 0.15);
          const textColor = hexToRgba(presentation.legend?.textColor || theme.nodeText || '#666666', 0.5);
          
          return (
            <div
              key={`milestone-${marker.pledgeClass || idx}-${idx}`}
              style={{
                position: 'absolute',
                left: 0,
                top: marker.avgY,
                width: '100%',
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${accentColor} 5%, ${accentColor} 95%, transparent 100%)`,
                pointerEvents: 'none',
                zIndex: 0,
                transform: 'translateY(-50%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: textColor,
                  background: presentation.legend?.panelBg || 'transparent',
                  padding: '2px 8px',
                  borderRadius: 4,
                  opacity: 0.7,
                }}
              >
                {marker.pledgeClass || ''}
              </div>
            </div>
          );
        } catch (error) {
          console.warn('Error rendering milestone marker:', error);
          return null;
        }
      })}

      {/* Show helpful message if no relationships exist */}
      {!loading && brothers.length > 0 && relationships.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '500px',
          textAlign: 'center',
          border: `2px solid ${theme.accent || '#c9a857'}`,
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            No Relationships Found
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Brothers are displayed but not connected. Use the admin panel to set "Big Brother" relationships.
          </div>
        </div>
      )}

      {selectedBrother && (
        <BrotherDetailModal
          brother={selectedBrother}
          familyId={family.id}
          onClose={() => closeProfile(true)}
          onUpdate={handleNodeUpdate}
          theme={theme}
          onToast={onToast}
        />
      )}
    </div>
  );
};

const TreeVisualization = ({ family, onToast, onChangeFamily }) => {
  return (
    <ReactFlowProvider>
      <TreeVisualizationInner family={family} onToast={onToast} onChangeFamily={onChangeFamily} />
    </ReactFlowProvider>
  );
};

export default TreeVisualization;

