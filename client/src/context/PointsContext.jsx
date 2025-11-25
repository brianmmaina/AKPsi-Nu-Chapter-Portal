import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import {
  clearPointsDataCache,
  getMemberEvents,
  getPointsData,
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

  const loadData = useCallback(async (targetTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPointsData(targetTimeframe);
      setPointsData(data);
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

  const contextValue = useMemo(
    () => ({
      timeframe,
      setTimeframe: handleSetTimeframe,
      pointsData,
      loading,
      error,
      refresh,
      openMemberPoints,
    }),
    [
      timeframe,
      handleSetTimeframe,
      pointsData,
      loading,
      error,
      refresh,
      openMemberPoints,
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

