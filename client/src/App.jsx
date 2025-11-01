import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import FamilySelection from './components/FamilySelection';
import FamilyTreeView from './components/FamilyTreeView';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, families } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFamilySelection, setShowFamilySelection] = useState(false);
  const [password, setPassword] = useState('');
  const [familiesList, setFamiliesList] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadFamilies = useCallback(async () => {
    try {
      const response = await families.getAll();
      setFamiliesList(response.data);
      return response.data;
    } catch (error) {
      // Log error but don't show toast on initial load (will show if retry fails)
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load families:', error);
      }
      throw error; // Re-throw so caller can handle
    }
  }, []);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const stored = sessionStorage.getItem('authenticated');
    const storedFamilyId = sessionStorage.getItem('selectedFamily');
    if (stored === 'true') {
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
        .catch((error) => {
          // Show error toast if loading fails
          setToast({ 
            message: 'Failed to load families. Please refresh the page.', 
            type: 'error' 
          });
          setLoading(false);
        });
    } else {
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
      
      // Check for success - handle both response.data.success and direct success
      if (response?.data?.success === true || response?.data?.success === 'true') {
        setIsAuthenticated(true);
        sessionStorage.setItem('authenticated', 'true');
        
        // Load families before showing selection
        try {
          const familiesData = await loadFamilies();
          setFamiliesList(familiesData);
        } catch (familyError) {
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
    sessionStorage.setItem('selectedFamily', family.id);
  };

  const handleChangeFamily = () => {
    setShowFamilySelection(true);
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
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-toast focus:p-4 focus:bg-primary focus:text-primary-contrast focus:rounded-lg focus:shadow-lg"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.padding = 'var(--space-4)';
          e.currentTarget.style.margin = 'var(--space-4)';
          e.currentTarget.style.overflow = 'visible';
          e.currentTarget.style.clip = 'auto';
          e.currentTarget.style.whiteSpace = 'normal';
          e.currentTarget.style.backgroundColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--primary-contrast)';
          e.currentTarget.style.borderRadius = 'var(--radius-lg)';
          e.currentTarget.style.zIndex = 'var(--z-toast)';
        }}
      >
        Skip to main content
      </a>
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
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.position = 'absolute';
            e.currentTarget.style.width = 'auto';
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.padding = 'var(--space-4)';
            e.currentTarget.style.margin = 'var(--space-4)';
            e.currentTarget.style.overflow = 'visible';
            e.currentTarget.style.clip = 'auto';
            e.currentTarget.style.whiteSpace = 'normal';
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary-contrast)';
            e.currentTarget.style.borderRadius = 'var(--radius-lg)';
            e.currentTarget.style.zIndex = 'var(--z-toast)';
          }}
        >
          Skip to main content
        </a>
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
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.position = 'absolute';
            e.currentTarget.style.width = 'auto';
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.padding = 'var(--space-4)';
            e.currentTarget.style.margin = 'var(--space-4)';
            e.currentTarget.style.overflow = 'visible';
            e.currentTarget.style.clip = 'auto';
            e.currentTarget.style.whiteSpace = 'normal';
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary-contrast)';
            e.currentTarget.style.borderRadius = 'var(--radius-lg)';
            e.currentTarget.style.zIndex = 'var(--z-toast)';
          }}
        >
          Skip to main content
        </a>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <main id="main-content">
          <FamilyTreeView 
            families={familiesList} 
            selectedFamily={selectedFamily} 
            onChangeFamily={handleChangeFamily}
            onToast={setToast}
          />
        </main>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.padding = 'var(--space-4)';
          e.currentTarget.style.margin = 'var(--space-4)';
          e.currentTarget.style.overflow = 'visible';
          e.currentTarget.style.clip = 'auto';
          e.currentTarget.style.whiteSpace = 'normal';
          e.currentTarget.style.backgroundColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--primary-contrast)';
          e.currentTarget.style.borderRadius = 'var(--radius-lg)';
          e.currentTarget.style.zIndex = 'var(--z-toast)';
        }}
      >
        Skip to main content
      </a>
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
