// The Nu Chapter Record — archive shell.
// Screen state machine (landing → gate → index → folios) with a nav back-stack,
// live chapter data (Express API), points (Sheets → Supabase → local), and
// the offline sample fallback with a status ribbon.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Masthead from './record/Masthead';
import LandingScreen from './record/LandingScreen';
import GateScreen from './record/GateScreen';
import IndexScreen from './record/IndexScreen';
import LedgerScreen from './record/LedgerScreen';
import AdminScreen from './record/AdminScreen';
import LineageScreen from './record/LineageScreen';
import TreeScreen from './record/TreeScreen';
import AddBrotherScreen from './record/AddBrotherScreen';
import NetworkScreen from './record/NetworkScreen';
import ResourcesScreen from './record/ResourcesScreen';
import BrotherModal from './record/BrotherModal';
import MajorModal from './record/MajorModal';
import { usePoints } from './context/PointsContext';
import { auth, families as familiesApi } from './api';
import { buildLiveModel, buildSampleModel } from './record/model';
import { photoBg } from './record/palette';
import { pointSystemConfig } from './config/pointSystemConfig';

// Chapter photos behind each screen, washed into the paper tone.
// Washes stay light so the photos show; text outside cards sits on local
// scrim panels (.ncr-hero / .ncr-band) instead of relying on the page wash.
const SCREEN_BG = {
  gate: ['/images/gate-bg.jpg', 0.8],
  landing: ['/images/landing-bg.jpg', 0.82],
  index: ['/images/index-bg.jpg', 0.84],
  rankings: ['/images/ledger-bg.jpg', 0.9],
  admin: ['/images/ledger-bg.jpg', 0.92],
  lineage: ['/images/lineage-bg.jpg', 0.86],
  addbrother: ['/images/lineage-bg.jpg', 0.9],
  alumni: ['/images/network-bg.jpg', 0.87],
  resources: ['/images/resources-bg.jpg', 0.88],
};
const TREE_BG_COUNT = 5;

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const hasValidSession = () => {
  const token = sessionStorage.getItem('authToken');
  const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0', 10);
  return Boolean(token) && Date.now() - loginTime < SESSION_EXPIRY_MS;
};

const clearSession = () => {
  sessionStorage.removeItem('authenticated');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('loginTime');
  sessionStorage.removeItem('selectedFamily');
  localStorage.removeItem('ncr_auth');
  localStorage.removeItem('ncr_loginTime');
};

function App() {
  // Session / auth
  const [authed, setAuthed] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [officerAuthed, setOfficerAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Navigation — unauthenticated visitors land directly on the password gate.
  const [screen, setScreen] = useState('gate');
  const [navStack, setNavStack] = useState([]);
  const [treeFamily, setTreeFamily] = useState('');
  const [selectedBrother, setSelectedBrother] = useState(null);
  const [searchMajor, setSearchMajor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live chapter data
  const [liveFamilies, setLiveFamilies] = useState(null);
  const [liveTrees, setLiveTrees] = useState(null);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const liveLoadingRef = useRef(false);

  // Network (Firebase)
  const [netUser, setNetUser] = useState(null);
  const [netAlumni, setNetAlumni] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const { pointsData, source: pointsSource, timeframe, setTimeframe, refresh: refreshPoints, lastSynced } = usePoints();

  const notify = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // ── Live data ──
  const loadLiveData = useCallback(async () => {
    if (liveLoadingRef.current) return false;
    liveLoadingRef.current = true;
    try {
      const fr = await familiesApi.getAll();
      const fams = fr.data;
      if (!Array.isArray(fams)) throw new Error('Unexpected response');
      const trees = {};
      await Promise.all(
        fams.map(async (f) => {
          try {
            const tr = await familiesApi.getTree(f.id);
            trees[String(f.id)] = tr.data || { brothers: [], relationships: [] };
          } catch {
            trees[String(f.id)] = { brothers: [], relationships: [] };
          }
        }),
      );
      setLiveFamilies(fams);
      setLiveTrees(trees);
      setLiveLoaded(true);
      setTreeFamily((prev) => (prev && trees[String(prev)] ? prev : String(fams[0]?.id ?? '')));
      return true;
    } catch {
      setLiveLoaded(false);
      return false;
    } finally {
      liveLoadingRef.current = false;
    }
  }, []);

  // ── Session bootstrap ──
  useEffect(() => {
    if (hasValidSession()) {
      setAuthed(true);
      setAuthToken(sessionStorage.getItem('authToken'));
      setScreen('index');
    } else {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('loginTime');
    }
    loadLiveData();
  }, [loadLiveData]);

  // ── Model ──
  const M = useMemo(() => {
    if (liveLoaded && liveFamilies) return buildLiveModel(liveFamilies, liveTrees, pointsData);
    return buildSampleModel();
  }, [liveLoaded, liveFamilies, liveTrees, pointsData]);

  const canWrite = M.live && !!authToken;
  const tfLabel = timeframe === 'YEAR' ? 'Academic Year' : pointSystemConfig.semester;

  // ── Navigation ──
  const nav = useCallback(
    (next, patch = {}) => {
      setNavStack((prev) => [...prev, screen]);
      setScreen(next);
      setSelectedBrother(null);
      setSearchQuery('');
      setSearchMajor(null);
      if (patch.treeFamily !== undefined) setTreeFamily(patch.treeFamily);
      window.scrollTo(0, 0);
    },
    [screen],
  );

  const back = useCallback(() => {
    setNavStack((prev) => {
      if (!prev.length) return prev;
      const ns = prev.slice();
      const prevScreen = ns.pop();
      setScreen(prevScreen);
      setSelectedBrother(null);
      return ns;
    });
    window.scrollTo(0, 0);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setAuthed(false);
    setAuthToken(null);
    setOfficerAuthed(false);
    setScreen('gate');
    setNavStack([]);
    setNetUser(null);
    setNetAlumni(null);
    window.scrollTo(0, 0);
  }, []);

  // ── Auth ──
  const authenticate = useCallback(async (password) => {
    try {
      const response = await auth.login(password);
      if (response?.data?.success === true && response?.data?.token) {
        return { ok: true, token: response.data.token, role: response.data.role || 'member', live: true };
      }
      return { ok: false, error: 'Invalid response from server' };
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          return { ok: false, error: error.response.data?.error || 'Too many attempts. Wait a few minutes.' };
        }
        if (error.response.status === 401) {
          return { ok: false, error: 'Invalid password. Please try again.' };
        }
        return { ok: false, error: error.response.data?.error || `Server error (${error.response.status}).` };
      }
      // Network unreachable — offline demo fallback
      return { ok: false, network: true };
    }
  }, []);

  const handleEnter = useCallback(
    async (e) => {
      e.preventDefault();
      if (!pw.trim()) {
        setLoginError('Please enter the chapter password.');
        return;
      }
      setLoginBusy(true);
      const res = await authenticate(pw);
      setLoginBusy(false);
      if (res.ok) {
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('authToken', res.token);
        sessionStorage.setItem('loginTime', String(Date.now()));
        setAuthed(true);
        setAuthToken(res.token);
        setScreen('index');
        setNavStack([]);
        setPw('');
        setLoginError('');
        window.scrollTo(0, 0);
        loadLiveData();
        refreshPoints();
        notify('Welcome to the archive — connected to the chapter records.');
      } else if (res.network) {
        setLoginError('Chapter server unreachable — check your connection and try again.');
        setPw('');
      } else {
        setLoginError(res.error || 'Invalid password. Please try again.');
        setPw('');
      }
    },
    [pw, authenticate, loadLiveData, refreshPoints, notify],
  );

  // Officer tools need the officer (admin) credential — the server tags the
  // JWT with a role and rejects writes from member tokens.
  const handleOfficerUnlock = useCallback(
    async (password) => {
      const res = await authenticate(password);
      if (res.ok) {
        if (res.role !== 'admin') {
          return { ok: false, error: 'That is the member password — officer tools need the officer credential.' };
        }
        setOfficerAuthed(true);
        setAuthToken(res.token);
        sessionStorage.setItem('authToken', res.token);
        sessionStorage.setItem('loginTime', String(Date.now()));
        return { ok: true };
      }
      if (res.network) {
        return { ok: false, error: 'Server unreachable — try again once the connection is back.' };
      }
      return { ok: false, error: res.error };
    },
    [authenticate],
  );

  // ── Search ──
  const allBrothers = useMemo(() => Object.values(M.brothers), [M]);
  const q = searchQuery.trim().toLowerCase();
  const searchBrothers = useMemo(
    () =>
      q
        ? allBrothers
            .filter((b) => b.name.toLowerCase().includes(q))
            .slice(0, 6)
            .map((b) => ({
              id: b.id,
              name: b.name,
              meta: [b.major, b.pledgeClass].join(' · '),
              onClick: () => {
                setSelectedBrother(b.id);
                setSearchQuery('');
              },
            }))
        : [],
    [q, allBrothers],
  );
  const searchMajors = useMemo(() => {
    if (!q) return [];
    const map = {};
    allBrothers.forEach((b) => {
      if (b.major.toLowerCase().includes(q)) map[b.major] = (map[b.major] || 0) + 1;
    });
    return Object.keys(map)
      .slice(0, 5)
      .map((m) => ({
        major: m,
        countLabel: `${map[m]} ${map[m] === 1 ? 'brother' : 'brothers'}`,
        onClick: () => {
          setSearchMajor(m);
          setSearchQuery('');
        },
      }));
  }, [q, allBrothers]);

  // ── Index stats ──
  const indexStats = useMemo(() => {
    const pledgeClasses = new Set(allBrothers.map((b) => b.pledgeClass).filter((p) => p && p !== '—'));
    const tracked = pointsData ? pointsData.members.length : 0;
    return [
      { fig: String(pledgeClasses.size || '—'), label: 'Pledge Classes' },
      { fig: String(allBrothers.length), label: 'Brothers Enrolled' },
      { fig: String(M.famOrder.length), label: 'Families' },
      { fig: String(tracked), label: 'Tracked This Term' },
    ];
  }, [allBrothers, M, pointsData]);

  const refreshAll = useCallback(() => {
    notify('Refreshing from the chapter records…');
    refreshPoints();
    loadLiveData();
  }, [notify, refreshPoints, loadLiveData]);

  const officerHint = 'Officer credential · verified by the server';

  const showHeader = authed && screen !== 'landing' && screen !== 'gate';
  const headerActive =
    screen === 'rankings' || screen === 'admin'
      ? 'rankings'
      : screen === 'lineage' || screen === 'tree' || screen === 'addbrother'
        ? 'lineage'
        : screen;

  // Per-screen photo background; the tree cycles a photo per family.
  let bgStyle = {};
  if (screen === 'tree') {
    const idx = Math.max(0, M.famOrder.indexOf(treeFamily)) % TREE_BG_COUNT;
    bgStyle = photoBg(`/images/tree-${idx + 1}.jpg`, 0.88);
  } else if (SCREEN_BG[screen]) {
    bgStyle = photoBg(SCREEN_BG[screen][0], SCREEN_BG[screen][1]);
  }

  return (
    <ErrorBoundary>
      <div className="ncr-grain" style={{ minHeight: '100vh', ...bgStyle }}>
        {toast && (
          <div className="ncr-toast" style={{ background: toast.type === 'error' ? 'var(--ncr-crimson-deep)' : 'var(--ncr-ink)' }}>
            {toast.msg}
          </div>
        )}
        {!M.live && authed && (
          <div className="ncr-offline">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ncr-warn)' }} />
            Chapter server offline — showing sample records.
          </div>
        )}

        {screen === 'landing' && <LandingScreen onEnter={() => setScreen(authed ? 'index' : 'gate')} />}

        {screen === 'gate' && (
          <GateScreen
            pw={pw}
            onPwChange={(e) => setPw(e.target.value)}
            onSubmit={handleEnter}
            loginError={loginError}
            busy={loginBusy}
            onBackToLanding={() => setScreen('landing')}
          />
        )}

        {showHeader && (
          <Masthead
            active={headerActive}
            canBack={navStack.length > 0}
            onBack={back}
            onNav={(key) => nav(key)}
            onLogout={logout}
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            searchBrothers={searchBrothers}
            searchMajors={searchMajors}
          />
        )}

        {authed && (
          <main id="main-content">
            {screen === 'index' && <IndexScreen onOpen={(key) => nav(key)} stats={indexStats} />}

            {screen === 'rankings' && (
              <LedgerScreen
                M={M}
                pointsSource={pointsSource}
                lastSynced={lastSynced}
                timeframe={timeframe}
                onTimeframe={setTimeframe}
                onRefresh={refreshAll}
                onOpenBrother={setSelectedBrother}
                onOpenAdmin={() => nav('admin')}
                tfLabel={tfLabel}
              />
            )}

            {screen === 'admin' && (
              <AdminScreen
                M={M}
                canWrite={canWrite}
                officerAuthed={officerAuthed}
                officerHint={officerHint}
                onOfficerUnlock={handleOfficerUnlock}
                onLockOfficer={() => {
                  setOfficerAuthed(false);
                  notify('Officer tools locked.');
                }}
                onBackToLedger={() => nav('rankings')}
                onRosterChanged={loadLiveData}
                onOpenBrother={setSelectedBrother}
                onAddBrother={() => nav('addbrother')}
                notify={notify}
              />
            )}

            {screen === 'lineage' && (
              <LineageScreen M={M} onOpenFamily={(fid) => nav('tree', { treeFamily: fid })} />
            )}

            {screen === 'tree' && (
              <TreeScreen
                M={M}
                treeFamily={treeFamily}
                onSelectFamily={(fid) => setTreeFamily(fid)}
                onOpenBrother={setSelectedBrother}
                onBackToLineage={() => nav('lineage')}
                onAddBrother={() => nav('addbrother')}
                notify={notify}
              />
            )}

            {screen === 'addbrother' && (
              <AddBrotherScreen
                M={M}
                defaultFamily={treeFamily}
                canWrite={canWrite}
                onDone={async (fid) => {
                  await loadLiveData();
                  nav('tree', { treeFamily: fid });
                }}
                onCancel={() => nav('lineage')}
                notify={notify}
              />
            )}

            {screen === 'alumni' && (
              <NetworkScreen
                M={M}
                netUser={netUser}
                netAlumni={netAlumni}
                onSignedIn={(user, dir) => {
                  setNetUser(user);
                  setNetAlumni(dir);
                }}
                onSignedOut={() => {
                  setNetUser(null);
                  setNetAlumni(null);
                }}
                onOpenBrother={setSelectedBrother}
                notify={notify}
              />
            )}

            {screen === 'resources' && <ResourcesScreen />}
          </main>
        )}

        {selectedBrother && M.brothers[selectedBrother] && (
          <BrotherModal
            M={M}
            brotherId={selectedBrother}
            pointsData={pointsData}
            tfLabel={tfLabel}
            canEdit={canWrite && officerAuthed}
            onClose={() => setSelectedBrother(null)}
            onSaved={loadLiveData}
            notify={notify}
          />
        )}

        {searchMajor && (
          <MajorModal
            M={M}
            major={searchMajor}
            onClose={() => setSearchMajor(null)}
            onOpenBrother={(id) => {
              setSelectedBrother(id);
              setSearchMajor(null);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
