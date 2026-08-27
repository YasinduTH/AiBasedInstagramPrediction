import React from 'react';
import Card, { CardContent } from './Card';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel }) => {
  return (
    <Card>
      <CardContent style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              {title}
            </p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: '700', margin: 0 }}>
              {value}
            </h3>
            
            {trend && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '0.5rem' }}>
                <span style={{ 
                  color: trend > 0 ? 'var(--success)' : 'var(--error)', 
                  fontSize: '0.875rem', 
                  fontWeight: '500' 
                }}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {Icon && (
            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={24} color="var(--accent-primary)" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
