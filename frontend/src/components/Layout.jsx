import React from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
      }}>
        <Header 
          title={title} 
          subtitle={subtitle}
          user={user}
          profile={profile}
          onLogout={onLogout}
          onEditProfile={onEditProfile}
          onToggleSidebar={toggleSidebar}
        />
        
        <div className="mobile-padding" style={{ 
          padding: '2rem',
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
