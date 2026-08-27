import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Image as ImageIcon, ChevronRight, BarChart2 } from "lucide-react";

import { getUserPredictionHistory } from "../services/historyService";

import Layout from "../components/Layout";
import Button from "../components/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ContentOptimization from "../components/ContentOptimization";

const BACKEND_URL = "http://127.0.0.1:5000";

function History({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedItem, setExpandedItem] = useState(null); // Optional: if we want accordions, but for now we'll just show essential info and expand on click

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setError("");
        const records = await getUserPredictionHistory(user.uid);
        setHistory(records);
      } catch (err) {
        console.error("Failed to load prediction history:", err);
        setError("Unable to load your prediction history. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    try {
      let date;
      if (timestamp.toDate) date = timestamp.toDate();
      else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
      else date = new Date(timestamp);
      
      if (isNaN(date.getTime())) return "Unknown date";
      return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return "Unknown date";
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    if (imageUrl.startsWith("/")) return `${BACKEND_URL}${imageUrl}`;
    return `${BACKEND_URL}/${imageUrl}`;
  };

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout isAdmin={false} title="History" user={user}>
        <LoadingSpinner fullScreen={false} text="Loading prediction history..." />
      </Layout>
    );
  }

  return (
    <Layout 
      isAdmin={false} 
      title="Prediction History" 
      subtitle="View your previous Instagram engagement predictions and AI content optimization results."
      user={user}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {!error && history.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-xl)', 
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <HistoryIcon size={64} style={{ opacity: 0.2, color: 'var(--text-primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>No Predictions Yet</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
              You haven't made any Instagram engagement predictions yet. Start by analyzing your first post.
            </p>
            <Link to="/prediction" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Create Your First Prediction</Button>
            </Link>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Showing {history.length} prediction{history.length !== 1 ? 's' : ''}
            </p>

            {history.map((item) => {
              const input = item.userInput || {};
              const apiResponse = item.apiResponse || {};
              const apiImage = apiResponse.image || {};
              const imageDetails = item.imageDetails || {};
              const topLevelImage = item.image || {};
              const oldImage = input.image || {};
              
              const prediction = item.prediction || apiResponse.prediction || "Unknown";
              const confidence = typeof item.confidence === "number" ? item.confidence : typeof apiResponse.confidence === "number" ? apiResponse.confidence : null;
              
              const hasImage = apiImage.uploaded === true || apiImage.uploaded === 1 || apiImage.has_image === true || apiImage.hasImage === true || topLevelImage.uploaded === true || imageDetails.uploaded === true || input.hasImage === true || input.hasImage === 1 || oldImage.hasImage === true;
              
              const rawImageUrl = apiImage.image_url || apiImage.imageUrl || topLevelImage.image_url || topLevelImage.imageUrl || imageDetails.image_url || imageDetails.imageUrl || oldImage.imageUrl || null;
              const imageUrl = getImageUrl(rawImageUrl);

              const optimization = item.optimization || apiResponse.optimization || null;
              const optimizationScore = getValue(optimization?.score, optimization?.optimization_score, optimization?.optimizationScore);

              const isExpanded = expandedItem === item.id;

              return (
                <Card key={item.id} style={{ transition: 'all 0.2s', border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)' }}>
                  
                  {/* Card Summary (Always visible) */}
                  <div 
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="mobile-col mobile-padding"
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '1.5rem'
                    }}
                  >
                    <div className="mobile-w-full" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: 'var(--radius-sm)', 
                        backgroundColor: 'var(--bg-tertiary)',
                        backgroundImage: hasImage && imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {(!hasImage || !imageUrl) && <ImageIcon size={24} color="var(--text-muted)" />}
                      </div>
                      
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {input.category || "Uncategorized"}
                          <Badge variant={prediction === 'High' ? 'success' : prediction === 'Medium' ? 'warning' : 'error'}>
                            {prediction}
                          </Badge>
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mobile-w-full" style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '2rem' }}>
                        {confidence !== null && (
                          <div className="desktop-only" style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Confidence</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{(confidence * 100).toFixed(1)}%</p>
                          </div>
                        )}
                        
                        {optimizationScore !== null && (
                          <div className="desktop-only" style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Opt. Score</p>
                            <p style={{ fontWeight: '600', margin: 0 }}>{optimizationScore}/100</p>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="animate-fade-in" style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        
                        <div>
                          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Input Content</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <strong style={{ fontSize: '0.875rem', display: 'block' }}>Caption</strong>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{input.caption || "No caption provided"}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.875rem', display: 'block' }}>Hashtags</strong>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{input.hashtags || "None"}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Account Details</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <strong style={{ fontSize: '0.875rem', display: 'block' }}>Account Type</strong>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{input.accountType || "Not specified"}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.875rem', display: 'block' }}>Activity Level</strong>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{input.accountActivityLevel || "Not specified"}</p>
                            </div>
                          </div>
                        </div>

                        {optimization && (
                          <div style={{ gridColumn: '1 / -1', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <ContentOptimization optimization={optimization} />
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default History;