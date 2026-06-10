import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import HomeHub from './components/HomeHub';
import FamilySelection from './components/FamilySelection';
import FamilyTreeView from './components/FamilyTreeView';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import SkipToContent from './components/SkipToContent';
import PointsDashboard from './components/points/PointsDashboard';
import InformationHub from './components/InformationHub';
import ProfessionalNetwork from './components/ProfessionalNetwork';
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
  const [password, setPassword] = useState('');
  const [familiesList, setFamiliesList] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentView, setCurrentView] = useState('HOME');
  const [navHistory, setNavHistory] = useState(['HOME']);
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

  const navigateTo = useCallback((view) => {
    setCurrentView(view);
    setNavHistory((prev) => [...prev, view]);
  }, []);

  const navigateBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = [...prev];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setCurrentView(previousView);
      if (previousView === 'HOME') {
        setSelectedFamily(null);
        sessionStorage.removeItem('selectedFamily');
      }
      return newHistory;
    });
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentView('HOME');
    setNavHistory(['HOME']);
    setSelectedFamily(null);
    sessionStorage.removeItem('selectedFamily');
  }, []);

  useEffect(() => {
    // Check if already authenticated (with session expiration check)
    if (isSessionValid()) {
      setIsAuthenticated(true);
      loadFamilies()
        .then(() => {
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
        
        // Load families
        try {
          const familiesData = await loadFamilies();
          setFamiliesList(familiesData);
        } catch {
          setToast({ 
            message: 'Login successful, but failed to load families. Please refresh.', 
            type: 'error' 
          });
        }
        
        // Route to home after login
        setCurrentView('HOME');
        setNavHistory(['HOME']);
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
    sessionStorage.setItem('selectedFamily', family.id);
    navigateTo('TREE');
  };

  const handleHomeNavigation = (viewId) => {
    if (viewId === 'FAMILY_TREES') {
      navigateTo('FAMILY_SELECTION');
    } else if (viewId === 'POINTS') {
      navigateTo('POINTS');
    } else if (viewId === 'INFO') {
      navigateTo('INFO');
    } else if (viewId === 'NETWORK') {
      navigateTo('NETWORK');
    }
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

  const canGoBack = navHistory.length > 1;
  const isArchiveMode = currentView === 'HOME' || currentView === 'POINTS' || currentView === 'INFO' || currentView === 'FAMILY_SELECTION' || currentView === 'NETWORK';

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
      <main id="main-content" className="page-transition">
        {currentView === 'HOME' && (
          <HomeHub onNavigate={handleHomeNavigation} />
        )}
        {currentView === 'FAMILY_SELECTION' && (
          <FamilySelection 
            families={familiesList} 
            onSelectFamily={handleFamilySelect}
            onBack={navigateBack}
            onBackToHome={navigateToHome}
            canGoBack={canGoBack}
          />
        )}
        {currentView === 'TREE' && selectedFamily && (
          <FamilyTreeView
            families={familiesList}
            selectedFamily={selectedFamily}
            onChangeFamily={() => navigateTo('FAMILY_SELECTION')}
            onToast={setToast}
            onOpenPoints={openMemberPoints}
            onBack={navigateBack}
            onBackToHome={navigateToHome}
            canGoBack={canGoBack}
          />
        )}
        {currentView === 'POINTS' && (
          <PointsDashboard 
            onBack={navigateBack}
            onBackToHome={navigateToHome}
            canGoBack={canGoBack}
          />
        )}
        {currentView === 'INFO' && (
          <InformationHub
            onBack={navigateBack}
            onBackToHome={navigateToHome}
            canGoBack={canGoBack}
          />
        )}
        {currentView === 'NETWORK' && (
          <ProfessionalNetwork
            onBack={navigateBack}
            onBackToHome={navigateToHome}
            canGoBack={canGoBack}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}

export default App;
