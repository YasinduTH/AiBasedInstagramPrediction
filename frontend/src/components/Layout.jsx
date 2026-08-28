import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ 
  children, 
  isAdmin, 
  title, 
  subtitle, 
  user, 
  profile, 
  onLogout,
  onEditProfile
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (profile) return;
    if (!user?.uid) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          setLocalProfile(snapshot.data());
        }
      } catch (err) {
        console.error("Error loading profile in Layout:", err);
      }
    };
    loadProfile();
  }, [user?.uid, profile]);

  const activeProfile = profile || localProfile;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      navigate(isAdmin ? '/admin' : '/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar isAdmin={isAdmin} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 30,
            display: 'block'
          }}
          className="mobile-only"
        />
      )}

      
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'hidden'
      }}>
        <Header 
          title={title} 
          subtitle={subtitle}
          user={user}
          profile={activeProfile}
          onLogout={handleLogout}
          onEditProfile={isAdmin && !onEditProfile ? null : handleEditProfile}
          onToggleSidebar={toggleSidebar}
        />
        
        <div className="mobile-padding" style={{ 
          padding: '2rem',
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
