import React from 'react';
import { Lightbulb, PenTool, Hash, Image as ImageIcon, User, CheckCircle2, Target } from 'lucide-react';
import Card, { CardContent } from './Card';

const isObject = (val) => val != null && typeof val === 'object' && !Array.isArray(val);

const firstObject = (...args) => args.find(isObject) || null;
const firstArray = (...args) => args.find(Array.isArray) || [];
const displayText = (val) => (typeof val === 'string' ? val : null);

const formatKey = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const OptimizationBlock = ({ title, icon: Icon, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '600', margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
        <Icon size={18} color="var(--accent-primary)" /> {title}
      </h5>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {formatKey(key)}
            </span>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
              {Array.isArray(value) ? (
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {value.map((item, i) => (
                    <li key={i}>{String(item)}</li>
                  ))}
                </ul>
              ) : typeof value === 'object' && value !== null ? (
                JSON.stringify(value)
              ) : (
                String(value)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContentOptimization = ({ optimization }) => {
  if (!isObject(optimization)) return null;

  const score = optimization.score ?? optimization.optimization_score ?? optimization.optimizationScore ?? null;

  const caption = firstObject(optimization.caption, optimization.caption_analysis, optimization.captionAnalysis);
  const hashtagsData = firstObject(optimization.hashtags, optimization.hashtag_analysis, optimization.hashtagAnalysis);
  const imageData = firstObject(optimization.image, optimization.image_analysis, optimization.imageAnalysis);
  const accountData = firstObject(optimization.account, optimization.account_analysis, optimization.accountAnalysis);
  
  const recommendations = firstArray(optimization.recommendations, optimization.suggestions, optimization.recommended_improvements);
  
  const overall = displayText(optimization.overall_recommendation ?? optimization.overall ?? optimization.summary ?? null);
  const categoryRecommendation = displayText(optimization.category_recommendation ?? optimization.categoryRecommendation ?? null);

  return (
    <div style={{ textAlign: 'left', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', margin: 0 }}>
          <Lightbulb size={20} color="var(--warning)" /> Content Optimization Details
        </h4>
        {score !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Score</span>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{score}/100</span>
          </div>
        )}
      </div>

      {overall && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--info)' }}>Overall Recommendation</h5>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{overall}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <OptimizationBlock title="Caption Analysis" icon={PenTool} data={caption} />
        <OptimizationBlock title="Hashtag Analysis" icon={Hash} data={hashtagsData} />
        <OptimizationBlock title="Image Analysis" icon={ImageIcon} data={imageData} />
        <OptimizationBlock title="Account Analysis" icon={User} data={accountData} />
      </div>

      {categoryRecommendation && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%' }}>
            <Target size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '600' }}>Category Recommendation</h5>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{categoryRecommendation}</p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Recommended Improvements</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentOptimization;
