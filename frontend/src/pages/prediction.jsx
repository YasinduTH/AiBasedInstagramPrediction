import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Image as ImageIcon, X, Wand2, RefreshCcw, Bell, FileText, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

import { runPrediction } from "../services/predictionService";
import { createReminder } from "../services/reminderService";
import { generatePredictionPDF } from "../services/pdfReportService";

import Layout from "../components/Layout";
import Button from "../components/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import ContentOptimization from "../components/ContentOptimization";

function Prediction({ user }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Inputs
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountActivityLevel, setAccountActivityLevel] = useState(0.75);
  const [contentConsistency, setContentConsistency] = useState(0.7);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // PDF
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfError, setPdfError] = useState("");

  // Reminder
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNotes, setReminderNotes] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderError, setReminderError] = useState("");

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setImage(selectedFile);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setPdfMessage("");
    setPdfError("");
    setReminderMessage("");
    setReminderError("");
    setShowReminderForm(false);

    if (!caption.trim()) { setError("Please enter a caption."); return; }
    if (!category) { setError("Please select a content category."); return; }
    if (!accountType) { setError("Please select an account type."); return; }
    if (!image) { setError("Please upload an Instagram post image."); return; }
    if (accountActivityLevel < 0 || accountActivityLevel > 1) { setError("Activity Level must be between 0 and 1."); return; }
    if (contentConsistency < 0 || contentConsistency > 1) { setError("Content Consistency must be between 0 and 1."); return; }

    try {
      setLoading(true);
      const predictionResult = await runPrediction({
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        category,
        accountType,
        accountActivityLevel: Number(accountActivityLevel),
        contentConsistency: Number(contentConsistency),
        image,
      });

      console.log("Complete prediction response:", predictionResult);
      setResult(predictionResult);

      const prediction = predictionResult?.prediction || predictionResult?.apiResponse?.prediction || "Instagram Post";
      setReminderTitle(`Publish ${category} post - ${prediction} engagement`);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err?.message || "Prediction failed. Please make sure the AI prediction API is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result) { setPdfError("Prediction data is not available."); return; }
    try {
      setPdfGenerating(true);
      setPdfMessage("");
      setPdfError("");
      const fileName = generatePredictionPDF({ prediction: result, user: null, profile: null });
      console.log("PDF generated:", fileName);
      setPdfMessage("✓ PDF report generated successfully.");
    } catch (err) {
      console.error("PDF generation error:", err);
      setPdfError(err?.message || "Unable to generate the PDF report.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleOpenReminder = () => {
    setReminderMessage("");
    setReminderError("");
    const prediction = result?.prediction || result?.apiResponse?.prediction || "Instagram Post";
    if (!reminderTitle.trim()) {
      setReminderTitle(`Publish ${category || "Instagram"} post - ${prediction} engagement`);
    }
    setShowReminderForm(true);
  };

  const handleCreatePredictionReminder = async (e) => {
    e.preventDefault();
    setReminderError("");
    setReminderMessage("");

    if (!reminderTitle.trim()) { setReminderError("Please enter a reminder title."); return; }
    if (!reminderDate) { setReminderError("Please select a reminder date."); return; }
    if (!reminderTime) { setReminderError("Please select a reminder time."); return; }
    if (!result) { setReminderError("Prediction data is not available."); return; }

    try {
      setReminderSaving(true);
      const prediction = result?.prediction || result?.apiResponse?.prediction || "";
      const confidence = Number(result?.confidence ?? result?.apiResponse?.confidence ?? 0);
      
      const optimization = result?.optimization || result?.content_optimization || result?.apiResponse?.optimization || result?.apiResponse?.content_optimization || null;
      let optimizationScore = null;
      if (optimization) {
        optimizationScore = optimization.score ?? optimization.optimization_score ?? optimization.optimizationScore ?? null;
      }
      
      const imageUrl = result?.image?.imageUrl || result?.image?.image_url || result?.apiResponse?.image?.image_url || null;

      const createdReminder = await createReminder({
        title: reminderTitle.trim(),
        date: reminderDate,
        time: reminderTime,
        notes: reminderNotes.trim(),
        predictionId: result?.id || null,
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        category,
        prediction,
        confidence,
        optimizationScore,
        imageUrl,
      });

      console.log("Prediction reminder created:", createdReminder);
      setReminderMessage("✓ Reminder created successfully.");
      setTimeout(() => setShowReminderForm(false), 1200);
    } catch (err) {
      console.error("Prediction reminder error:", err);
      setReminderError(err?.message || "Unable to create the reminder.");
    } finally {
      setReminderSaving(false);
    }
  };

  const handleReset = () => {
    setCaption("");
    setHashtags("");
    setCategory("");
    setAccountType("");
    setAccountActivityLevel(0.75);
    setContentConsistency(0.7);
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError("");
    setPdfGenerating(false);
    setPdfMessage("");
    setPdfError("");
    setShowReminderForm(false);
    setReminderTitle("");
    setReminderDate("");
    setReminderTime("");
    setReminderNotes("");
    setReminderSaving(false);
    setReminderMessage("");
    setReminderError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Layout 
      isAdmin={false} 
      title="AI Prediction" 
      subtitle="Analyze your Instagram content using our AI-powered prediction and optimization system."
      user={user}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        <div className={result ? "grid-2-col" : ""} style={{ display: 'grid', gridTemplateColumns: result ? undefined : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
          
          {/* Input Form Column */}
          <div style={{ display: result ? 'none' : 'block' }}>
            {!loading && !result && (
              <Card>
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Image Upload Area */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem' }}>Image *</label>
                      <div 
                        onClick={() => !imagePreview && fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: imagePreview ? '0' : '3rem 2rem',
                          textAlign: 'center',
                          cursor: imagePreview ? 'default' : 'pointer',
                          backgroundColor: 'var(--bg-primary)',
                          transition: 'border-color 0.2s',
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '200px'
                        }}
                        onMouseEnter={(e) => { if (!imagePreview) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={(e) => { if (!imagePreview) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                      >
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: '400px' }} />
                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                  backdropFilter: 'blur(4px)',
                                  color: 'white',
                                  padding: '0.5rem',
                                  borderRadius: '50%',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--error)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.7)'}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%', marginBottom: '1rem' }}>
                              <UploadCloud size={32} color="var(--accent-primary)" />
                            </div>
                            <p style={{ fontWeight: '500', margin: '0 0 0.5rem 0' }}>Click or drag to upload</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Supports JPG, PNG, WEBP (Max 5MB)</p>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Caption */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Caption *</label>
                      <textarea
                        rows="4"
                        placeholder="Write a captivating caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                      />
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {caption.length} characters
                      </div>
                    </div>

                    {/* Grid for Dropdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        >
                          <option value="">Select category</option>
                          {['Entertainment', 'Fashion', 'Education', 'Food', 'Technology', 'Fitness', 'Travel', 'Lifestyle', 'Business', 'Other'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Account Type *</label>
                        <select
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        >
                          <option value="">Select account type</option>
                          {['Personal', 'Creator', 'Business'].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Hashtags</label>
                      <input
                        type="text"
                        placeholder="#srilanka #travel #sunset"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Activity Level */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Activity Level</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 1rem 0' }}>How active is this Instagram account?</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <span>Less Active</span>
                        <span>Very Active</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={accountActivityLevel}
                        onChange={(e) => setAccountActivityLevel(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                        {Number(accountActivityLevel).toFixed(2)}
                      </div>
                    </div>

                    {/* Content Consistency */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Content Consistency</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 1rem 0' }}>How consistently does the account publish similar content?</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <span>Inconsistent</span>
                        <span>Consistent</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={contentConsistency}
                        onChange={(e) => setContentConsistency(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                        {Number(contentConsistency).toFixed(2)}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ paddingTop: '1rem' }}>
                      <Button variant="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
                        <Wand2 size={18} />
                        Predict Engagement
                      </Button>
                    </div>

                  </form>
                </CardContent>
              </Card>
            )}
            
            {loading && (
              <Card style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingSpinner text="Analyzing your Instagram post... This may take a moment." />
              </Card>
            )}
          </div>

          {/* Result Area */}
          {result && !loading && (
            <div className="animate-fade-in" style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <Card style={{ borderTop: `4px solid ${result.prediction === 'High' ? 'var(--success)' : result.prediction === 'Medium' ? 'var(--warning)' : 'var(--error)'}` }}>
                <CardContent style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '1rem' }}>
                    AI Engagement Result
                  </p>
                  
                  <h2 style={{ 
                    fontSize: '4rem', 
                    fontWeight: '800', 
                    margin: '0 0 1rem 0',
                    lineHeight: '1',
                    color: result.prediction === 'High' ? 'var(--success)' : result.prediction === 'Medium' ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {result.prediction.toUpperCase()}
                  </h2>

                  <div style={{ display: 'inline-block', backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid var(--border-color)', marginBottom: '2.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.25rem' }}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Confidence</span>
                  </div>

                  {result.optimization && (
                     <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        padding: '1.5rem', 
                        borderRadius: 'var(--radius-lg)', 
                        border: '1px solid var(--border-color)',
                        marginBottom: '2rem'
                     }}>
                        <ContentOptimization optimization={result.optimization} />
                     </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={handleReset}>
                      <RefreshCcw size={18} /> Analyze Another
                    </Button>
                    <Button variant="primary" onClick={handleOpenReminder}>
                      <Bell size={18} /> Create Reminder
                    </Button>
                    <Button variant="secondary" onClick={handleExportPDF} disabled={pdfGenerating}>
                      <FileText size={18} /> {pdfGenerating ? "Generating..." : "Export PDF"}
                    </Button>
                  </div>
                  
                  {pdfMessage && <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '1rem' }}>{pdfMessage}</p>}
                  {pdfError && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '1rem' }}>{pdfError}</p>}
                  
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Reminder Modal */}
      <Modal
        isOpen={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        title="Schedule Post Reminder"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReminderForm(false)} disabled={reminderSaving}>Cancel</Button>
            <Button variant="primary" onClick={handleCreatePredictionReminder} disabled={reminderSaving}>
              {reminderSaving ? "Saving..." : "Save Reminder"}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {reminderMessage && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              {reminderMessage}
            </div>
          )}
          
          {reminderError && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {reminderError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Reminder Title *</label>
            <input 
              type="text" 
              value={reminderTitle} 
              onChange={(e) => setReminderTitle(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date *</label>
              <input 
                type="date" 
                min={new Date().toISOString().split("T")[0]}
                value={reminderDate} 
                onChange={(e) => setReminderDate(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Time *</label>
              <input 
                type="time" 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Notes (Optional)</label>
            <textarea
              rows="3"
              value={reminderNotes}
              onChange={(e) => setReminderNotes(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
              }}
              placeholder="e.g. Add location tag, tag collaborators..."
            />
          </div>

        </div>
      </Modal>
    </Layout>
  );
}

export default Prediction;