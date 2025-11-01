import { useState, useEffect } from 'react';
import Login from './components/Login';
import FamilySelection from './components/FamilySelection';
import FamilyTreeView from './components/FamilyTreeView';
import Toast from './components/Toast';
import { auth, families } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFamilySelection, setShowFamilySelection] = useState(false);
  const [password, setPassword] = useState('');
  const [familiesList, setFamiliesList] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const stored = sessionStorage.getItem('authenticated');
    const storedFamilyId = sessionStorage.getItem('selectedFamily');
    if (stored === 'true') {
      setIsAuthenticated(true);
      loadFamilies().then((familiesData) => {
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
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadFamilies = async () => {
    try {
      const response = await families.getAll();
      setFamiliesList(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to load families:', error);
      return [];
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login with password:', password ? '***' : 'empty');
      const response = await auth.login(password);
      console.log('Login response:', response);
      
      // Check for success - handle both response.data.success and direct success
      if (response?.data?.success === true || response?.data?.success === 'true') {
        console.log('Login successful, updating state...');
        setIsAuthenticated(true);
        sessionStorage.setItem('authenticated', 'true');
        
        // Load families before showing selection
        try {
          const familiesData = await loadFamilies();
          console.log('Families loaded:', familiesData);
          setFamiliesList(familiesData);
        } catch (familyError) {
          console.error('Failed to load families:', familyError);
          setToast({ message: 'Login successful, but failed to load families. Please refresh.', type: 'error' });
        }
        
        setShowFamilySelection(true);
        setPassword(''); // Clear password field
      } else {
        console.error('Unexpected response structure:', response);
        setToast({ message: 'Invalid response from server', type: 'error' });
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.error || error.message || 'Connection error. Check backend URL.';
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

  // Debug logging for render
  console.log('App render state:', {
    loading,
    isAuthenticated,
    showFamilySelection,
    familiesCount: familiesList.length,
    selectedFamily: selectedFamily?.name
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen royal-bg">
        <div className="text-xl" style={{ color: '#D3AF37', fontFamily: "'PT Serif', serif" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <Login password={password} setPassword={setPassword} handleLogin={handleLogin} />
      </>
    );
  }

  if (showFamilySelection) {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <FamilySelection families={familiesList} onSelectFamily={handleFamilySelect} />
      </>
    );
  }

  if (selectedFamily) {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <FamilyTreeView 
          families={familiesList} 
          selectedFamily={selectedFamily} 
          onChangeFamily={handleChangeFamily}
          onToast={setToast}
        />
      </>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <FamilySelection families={familiesList} onSelectFamily={handleFamilySelect} />
    </>
  );
}

export default App;
