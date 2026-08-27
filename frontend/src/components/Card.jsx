import React from 'react';

const Card = ({ children, className = '', style = {}, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', style = {} }) => (
  <div style={{ padding: '1.5rem 1.5rem 0', ...style }} className={className}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', style = {} }) => (
  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)', ...style }} className={className}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '', style = {} }) => (
  <div style={{ padding: '1.5rem', ...style }} className={className}>
    {children}
  </div>
);

export default Card;
