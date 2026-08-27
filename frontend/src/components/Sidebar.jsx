import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wand2, 
  History, 
  Bell, 
  ShieldAlert,
  X
} from 'lucide-react';
import logo from '../assets/logo.png';

const Sidebar = ({ isAdmin, isOpen, onClose }) => {
  const location = useLocation();

  const navItems = isAdmin 
    ? [
        { path: '/admin', label: 'Admin Dashboard', icon: ShieldAlert },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/prediction', label: 'AI Prediction', icon: Wand2 },
        { path: '/history', label: 'History', icon: History },
        { path: '/reminders', label: 'Reminders', icon: Bell },
      ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out',
    }} className="sidebar-responsive">
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={logo} alt="Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ 
            fontWeight: '700', 
            fontSize: '0.85rem',
            lineHeight: '1.2',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--text-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '170px'
          }}>
            AI-Based Instagram Prediction & Content Optimization
          </span>
        </div>
        <button 
          onClick={onClose}
          className="mobile-only"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>
      </div>

      <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <p style={{ 
          fontSize: '0.75rem', 
          fontWeight: '600', 
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
          paddingLeft: '0.75rem'
        }}>
          Menu
        </p>
        
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                fontWeight: isActive ? '500' : '400',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <item.icon size={20} color={isActive ? "white" : "currentColor"} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
