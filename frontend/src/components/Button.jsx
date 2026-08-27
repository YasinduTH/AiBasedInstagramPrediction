import React from 'react';

const Button = ({ children, variant = 'primary', className = '', style = {}, ...props }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: 'white',
      boxShadow: 'var(--shadow-md)',
    },
    secondary: {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: 'var(--error-bg)',
      color: 'var(--error)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
    },
  };

  const hoverVariants = {
    primary: {
      backgroundColor: 'var(--accent-primary-hover)',
      transform: 'translateY(-1px)',
    },
    secondary: {
      backgroundColor: '#475569',
    },
    danger: {
      backgroundColor: 'var(--error)',
      color: 'white',
    },
    ghost: {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
    },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const currentStyle = {
    ...baseStyle,
    ...variants[variant],
    ...(isHovered ? hoverVariants[variant] : {}),
    ...(props.disabled ? { opacity: 0.6, cursor: 'not-allowed', transform: 'none' } : {})
  };

  return (
    <button
      style={{ ...currentStyle, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
