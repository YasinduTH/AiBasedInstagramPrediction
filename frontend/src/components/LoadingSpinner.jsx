import React from 'react';

const LoadingSpinner = ({ size = 24, text = 'Loading...', fullScreen = false }) => {
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div 
        style={{
          width: size,
          height: size,
          border: '3px solid var(--bg-tertiary)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</p>}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
