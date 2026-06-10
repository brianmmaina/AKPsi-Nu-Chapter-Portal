import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import {
  addManualAdjustment,
  clearPointsDataCache,
  createEvent,
  getMemberEvents,
  getPointsData,
  recordAttendance,
  updateEvent,
} from '../services/pointsService';
import MemberPointsDetailModal from '../components/points/MemberPointsDetailModal';

const DEFAULT_TIMEFRAME = 'SEMESTER';

const PointsContext = createContext(null);

export const PointsProvider = ({ children }) => {
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMemberId, setActiveMemberId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const loadData = useCallback(async (targetTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPointsData(targetTimeframe);
      setPointsData(data);
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

  const handleSetTimeframe = useCallback((nextTimeframe) => {
    setTimeframe(nextTimeframe);
  }, []);

  const openMemberPoints = useCallback((memberId) => {
    if (!memberId) return;
    setActiveMemberId(String(memberId));
    setIsModalOpen(true);
  }, []);

  const closeMemberPoints = useCallback(() => {
    setIsModalOpen(false);
    setActiveMemberId(null);
  }, []);

  const activeMemberSummary = useMemo(() => {
    if (!pointsData || !activeMemberId) return null;
    return pointsData.members.find((member) => member.memberId === activeMemberId) || null;
  }, [pointsData, activeMemberId]);

  const activeMemberEvents = useMemo(() => {
    if (!pointsData || !activeMemberId) return [];
    return getMemberEvents(pointsData, activeMemberId);
  }, [pointsData, activeMemberId]);

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
    async (eventId, memberIds) => {
      await recordAttendance(eventId, memberIds);
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

  const contextValue = useMemo(
    () => ({
      timeframe,
      setTimeframe: handleSetTimeframe,
      pointsData,
      loading,
      error,
      refresh,
      lastSynced,
      openMemberPoints,
      actions: {
        createEvent: createEventAction,
        updateEvent: updateEventAction,
        recordAttendance: recordAttendanceAction,
        addManualAdjustment: addAdjustmentAction,
      },
    }),
    [
      timeframe,
      handleSetTimeframe,
      pointsData,
      loading,
      error,
      refresh,
      lastSynced,
      openMemberPoints,
      createEventAction,
      updateEventAction,
      recordAttendanceAction,
      addAdjustmentAction,
    ],
  );

  return (
    <PointsContext.Provider value={contextValue}>
      {children}
      <MemberPointsDetailModal
        isOpen={isModalOpen}
        onClose={closeMemberPoints}
        member={activeMemberSummary}
        events={activeMemberEvents}
        timeframe={timeframe}
      />
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const ctx = useContext(PointsContext);
  if (!ctx) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return ctx;
};

