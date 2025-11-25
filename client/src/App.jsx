import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import FamilySelection from './components/FamilySelection';
import FamilyTreeView from './components/FamilyTreeView';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import SkipToContent from './components/SkipToContent';
import PointsDashboard from './components/points/PointsDashboard';
import { usePoints } from './context/PointsContext';
import { auth, families } from './api';

// Session expiration time: 24 hours in milliseconds
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Check if session has expired
const isSessionValid = () => {
  const token = sessionStorage.getItem('authToken');
  const loginTime = sessionStorage.getItem('loginTime');
  
  if (!token || !loginTime) {
    return false;
  }
  
  const now = Date.now();
  const loginTimestamp = parseInt(loginTime, 10);
  
  if (now - loginTimestamp > SESSION_EXPIRY_MS) {
    // Session expired, clear storage
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('selectedFamily');
    sessionStorage.removeItem('loginTime');
    return false;
  }
  
  return true;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFamilySelection, setShowFamilySelection] = useState(false);
  const [password, setPassword] = useState('');
  const [familiesList, setFamiliesList] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('TREE');
  const { openMemberPoints } = usePoints();

  const loadFamilies = useCallback(async () => {
    try {
      const response = await families.getAll();
      setFamiliesList(response.data);
      return response.data;
    } catch (err) {
      // Log error but don't show toast on initial load (will show if retry fails)
      if (import.meta.env.DEV) {
        console.error('Failed to load families:', err);
      }
      throw err; // Re-throw so caller can handle
    }
  }, []);

  useEffect(() => {
    // Check if already authenticated (with session expiration check)
    if (isSessionValid()) {
    const storedFamilyId = sessionStorage.getItem('selectedFamily');
      setIsAuthenticated(true);
      loadFamilies()
        .then((familiesData) => {
          if (storedFamilyId && familiesData.length > 0) {
            const family = familiesData.find(f => f.id === parseInt(storedFamilyId));
            if (family) {
              setSelectedFamily(family);
              setShowFamilySelection(false);
            } else {
              setShowFamilySelection(true);
            }
          } else {
            setShowFamilySelection(true);
          }
          setLoading(false);
        })
        .catch(() => {
          // Show error toast if loading fails
          setToast({ 
            message: 'Session expired or failed to load families. Please login again.', 
            type: 'error' 
          });
          // Clear invalid session
          sessionStorage.removeItem('authenticated');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('selectedFamily');
          sessionStorage.removeItem('loginTime');
          setIsAuthenticated(false);
          setLoading(false);
        });
    } else {
      // Session expired or doesn't exist
      setLoading(false);
    }
  }, [loadFamilies]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setToast({ message: 'Please enter a password', type: 'error' });
      return;
    }

    try {
      const response = await auth.login(password);
      
      // Check for success and token
      if (response?.data?.success === true && response?.data?.token) {
        const token = response.data.token;
        const now = Date.now();
        
        setIsAuthenticated(true);
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('loginTime', now.toString());
        
        // Load families before showing selection
        try {
          const familiesData = await loadFamilies();
          setFamiliesList(familiesData);
        } catch {
          setToast({ 
            message: 'Login successful, but failed to load families. Please refresh.', 
            type: 'error' 
          });
        }
        
        setShowFamilySelection(true);
        setPassword(''); // Clear password field
      } else {
        setToast({ message: 'Invalid response from server', type: 'error' });
        setPassword('');
      }
    } catch (error) {
      // Provide specific error messages
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 429) {
          errorMessage = error.response.data?.error || 'Too many login attempts. Please wait a few minutes.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid password. Please try again.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      } else {
        // Error setting up request
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setToast({ message: errorMessage, type: 'error' });
      setPassword('');
    }
  };

  const handleFamilySelect = (family) => {
    setSelectedFamily(family);
    setShowFamilySelection(false);
    setActiveView('TREE');
    sessionStorage.setItem('selectedFamily', family.id);
  };

  const handleChangeFamily = () => {
    setShowFamilySelection(true);
    setActiveView('TREE');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen royal-bg">
        <div
          style={{
            fontSize: 'var(--text-xl)',
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
  return (
    <ErrorBoundary>
      <SkipToContent />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <main id="main-content">
        <Login password={password} setPassword={setPassword} handleLogin={handleLogin} />
      </main>
    </ErrorBoundary>
  );
  }

  if (showFamilySelection) {
    return (
      <ErrorBoundary>
        <SkipToContent />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <main id="main-content">
          <FamilySelection families={familiesList} onSelectFamily={handleFamilySelect} />
        </main>
      </ErrorBoundary>
    );
  }

  if (selectedFamily) {
    return (
      <ErrorBoundary>
        <SkipToContent />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <main id="main-content">
          <div className="app-view-toggle" role="tablist" aria-label="Main view">
            <button
              type="button"
              className={`app-view-toggle__btn ${activeView === 'TREE' ? 'app-view-toggle__btn--active' : ''}`}
              onClick={() => setActiveView('TREE')}
              role="tab"
              aria-selected={activeView === 'TREE'}
            >
              Family Tree
            </button>
            <button
              type="button"
              className={`app-view-toggle__btn ${activeView === 'POINTS' ? 'app-view-toggle__btn--active' : ''}`}
              onClick={() => setActiveView('POINTS')}
              role="tab"
              aria-selected={activeView === 'POINTS'}
            >
              Points
            </button>
          </div>
          {activeView === 'TREE' ? (
            <FamilyTreeView 
              families={familiesList} 
              selectedFamily={selectedFamily} 
              onChangeFamily={handleChangeFamily}
              onToast={setToast}
              onOpenPoints={openMemberPoints}
            />
          ) : (
            <PointsDashboard />
          )}
        </main>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SkipToContent />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <main id="main-content">
        <FamilySelection families={familiesList} onSelectFamily={handleFamilySelect} />
      </main>
    </ErrorBoundary>
  );
}

export default App;
