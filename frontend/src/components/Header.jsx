import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';

const Header = ({ title, subtitle, user, profile, onLogout, onEditProfile, onToggleSidebar }) => {
  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="mobile-only"
          onClick={onToggleSidebar}
          style={{ color: 'var(--text-primary)', padding: '0.25rem' }}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="hide-mobile" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            {subtitle}
          </p>
        )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* User Profile Info */}
        <div 
          onClick={onEditProfile}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            cursor: onEditProfile ? 'pointer' : 'default',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { if(onEditProfile) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
          onMouseLeave={(e) => { if(onEditProfile) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--accent-primary)',
          }}>
            <User size={18} color="var(--text-primary)" />
          </div>
          <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {profile?.fullName || 'User'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.email || ''}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <LogOut size={18} />
          <span className="hide-mobile">Logout</span>
        </button>

      </div>
    </header>
  );
};

export default Header;
