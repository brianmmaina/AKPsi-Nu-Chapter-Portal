import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import {
  addManualAdjustment,
  clearPointsDataCache,
  createEvent,
  getMemberEvents,
  getPointsData,
  getPointsSource,
  recordAttendance,
  setCurrentTermLabel,
  updateEvent,
} from '../services/pointsService';
import { pointSystemConfig } from '../config/pointSystemConfig';
import { settings as settingsApi } from '../api';

const DEFAULT_TIMEFRAME = 'SEMESTER';

const PointsContext = createContext(null);

export const PointsProvider = ({ children }) => {
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME);
  const [pointsData, setPointsData] = useState(null);
  const [source, setSource] = useState('local');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [term, setTerm] = useState(pointSystemConfig.semester);

  const loadData = useCallback(async (targetTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPointsData(targetTimeframe);
      setPointsData(data);
      setSource(getPointsSource());
      setLastSynced(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe, loadData]);

  const refresh = useCallback(
    async (targetTimeframe = timeframe) => {
      clearPointsDataCache();
      await loadData(targetTimeframe);
    },
    [timeframe, loadData],
  );

  // The live term comes from the chapter server; the config value is only a
  // fallback. When it differs, re-point the points service and reload.
  useEffect(() => {
    let alive = true;
    settingsApi
      .get()
      .then((res) => {
        const serverTerm = res?.data?.current_term;
        if (alive && serverTerm && serverTerm !== pointSystemConfig.semester) {
          setTerm(serverTerm);
          setCurrentTermLabel(serverTerm);
          refresh();
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSeason = useCallback(
    async (label) => {
      const trimmed = String(label || '').trim();
      if (!trimmed) throw new Error('Enter a term, e.g. "Fall 2026".');
      await settingsApi.update({ current_term: trimmed });
      setTerm(trimmed);
      setCurrentTermLabel(trimmed);
      await refresh();
    },
    [refresh],
  );

  const handleSetTimeframe = useCallback((nextTimeframe) => {
    setTimeframe(nextTimeframe);
  }, []);

  const createEventAction = useCallback(
    async (definition) => {
      await createEvent(definition);
      await refresh();
    },
    [refresh],
  );

  const updateEventAction = useCallback(
    async (id, updates) => {
      await updateEvent(id, updates);
      await refresh();
    },
    [refresh],
  );

  const recordAttendanceAction = useCallback(
    async (eventId, memberIds, fallbackPoints) => {
      await recordAttendance(eventId, memberIds, fallbackPoints);
      await refresh();
    },
    [refresh],
  );

  const addAdjustmentAction = useCallback(
    async (memberId, deltaPoints, note) => {
      await addManualAdjustment(memberId, deltaPoints, note);
      await refresh();
    },
    [refresh],
  );

  const memberEvents = useCallback(
    (memberId) => {
      if (!pointsData || !memberId) return [];
      return getMemberEvents(pointsData, String(memberId));
    },
    [pointsData],
  );

  const contextValue = useMemo(
    () => ({
      timeframe,
      setTimeframe: handleSetTimeframe,
      pointsData,
      source,
      loading,
      error,
      refresh,
      lastSynced,
      memberEvents,
      term,
      actions: {
        createEvent: createEventAction,
        updateEvent: updateEventAction,
        recordAttendance: recordAttendanceAction,
        addManualAdjustment: addAdjustmentAction,
        setSeason,
      },
    }),
    [
      timeframe,
      handleSetTimeframe,
      pointsData,
      source,
      loading,
      error,
      refresh,
      lastSynced,
      memberEvents,
      term,
      createEventAction,
      updateEventAction,
      recordAttendanceAction,
      addAdjustmentAction,
      setSeason,
    ],
  );

  return <PointsContext.Provider value={contextValue}>{children}</PointsContext.Provider>;
};

export const usePoints = () => {
  const ctx = useContext(PointsContext);
  if (!ctx) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return ctx;
};
