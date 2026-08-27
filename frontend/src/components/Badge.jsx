import React from 'react';

const Badge = ({ children, variant = 'default', className = '', style = {} }) => {
  const variants = {
    default: {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-secondary)',
    },
    success: {
      backgroundColor: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    },
    warning: {
      backgroundColor: 'var(--warning-bg)',
      color: 'var(--warning)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
    },
    error: {
      backgroundColor: 'var(--error-bg)',
      color: 'var(--error)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    info: {
      backgroundColor: 'var(--info-bg)',
      color: 'var(--info)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
    },
    primary: {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      color: 'var(--accent-primary)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
    }
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        ...selectedVariant,
        ...style
      }}
      className={className}
    >
      {children}
    </span>
  );
};

export default Badge;
