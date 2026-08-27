import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle2, RotateCcw, Trash2, Plus, RefreshCcw } from "lucide-react";

import {
  createReminder,
  getUserReminders,
  completeReminder,
  reopenReminder,
  deleteReminder,
} from "../services/reminderService";

import Layout from "../components/Layout";
import Button from "../components/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

function Reminders({ user }) {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // Reminder State
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUserReminders();
      setReminders(data);
    } catch (err) {
      console.error("Error loading reminders:", err);
      setError(err.message || "Unable to load reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleCreateReminder = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);
      await createReminder({ title, date, time, notes });
      setTitle("");
      setDate("");
      setTime("");
      setNotes("");
      setSuccess("Reminder created successfully.");
      await loadReminders();
    } catch (err) {
      console.error("Error creating reminder:", err);
      setError(err.message || "Unable to create reminder.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      setError("");
      setSuccess("");
      await completeReminder(id);
      setSuccess("Reminder marked as completed.");
      await loadReminders();
    } catch (err) {
      console.error("Error completing reminder:", err);
      setError(err.message || "Unable to complete reminder.");
    }
  };

  const handleReopen = async (id) => {
    try {
      setError("");
      setSuccess("");
      await reopenReminder(id);
      setSuccess("Reminder reopened.");
      await loadReminders();
    } catch (err) {
      console.error("Error reopening reminder:", err);
      setError(err.message || "Unable to reopen reminder.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this reminder?");
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await deleteReminder(id);
      setSuccess("Reminder deleted successfully.");
      await loadReminders();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      setError(err.message || "Unable to delete reminder.");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "No date";
    try {
      const dateObject = new Date(`${dateValue}T00:00:00`);
      return dateObject.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateValue;
    }
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "No time";
    try {
      const [hours, minutes] = timeValue.split(":");
      const dateObject = new Date();
      dateObject.setHours(Number(hours), Number(minutes), 0, 0);
      return dateObject.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch {
      return timeValue;
    }
  };

  const isPastReminder = (reminder) => {
    if (!reminder.date || !reminder.time || reminder.completed) return false;
    const reminderDate = new Date(`${reminder.date}T${reminder.time}`);
    return reminderDate < new Date();
  };

  if (loading && reminders.length === 0) {
    return (
      <Layout isAdmin={false} title="Reminders" user={user}>
        <LoadingSpinner fullScreen={false} text="Loading your reminders..." />
      </Layout>
    );
  }

  return (
    <Layout 
      isAdmin={false} 
      title="Post Reminders" 
      subtitle="Schedule reminders for your upcoming Instagram content."
      user={user}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Messages */}
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Error: </strong> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <strong>Success: </strong> {success}
          </div>
        )}

        {/* Layout wrapper for form + list */}
        <div className="grid-responsive-1-2" style={{ alignItems: 'start' }}>
          
          {/* Create Reminder Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Publish travel post"
                    required
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', outline: 'none',
                    }}
                  />
                </div>
                
                <div className="grid-2-col" style={{ gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
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
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows="3"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <Button variant="primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                  <Plus size={18} /> {saving ? "Creating..." : "Create Reminder"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reminders List */}
          <Card style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Your Reminders</h3>
              <Button variant="ghost" onClick={loadReminders} disabled={loading} style={{ padding: '0.5rem' }}>
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>

            {loading && reminders.length > 0 && (
              <div style={{ marginBottom: '1rem' }}><LoadingSpinner text="" /></div>
            )}

            {!loading && reminders.length === 0 && (
              <div style={{ 
                textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' 
              }}>
                <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--text-primary)' }} />
                <p style={{ margin: 0, fontWeight: '500' }}>No reminders yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Create your first Instagram post reminder.</p>
              </div>
            )}

            {reminders.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reminders.map((reminder) => {
                  const past = isPastReminder(reminder);
                  const isCompleted = reminder.completed;

                  return (
                    <div 
                      key={reminder.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        padding: '1.5rem',
                        transition: 'all 0.2s',
                        opacity: isCompleted ? 0.6 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '600', 
                            margin: '0 0 0.5rem 0',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}>
                            {reminder.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={14} /> {formatDate(reminder.date)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={14} /> {formatTime(reminder.time)}</span>
                          </div>
                        </div>
                        <Badge variant={isCompleted ? 'success' : past ? 'error' : 'default'}>
                          {isCompleted ? 'Completed' : past ? 'Overdue' : 'Upcoming'}
                        </Badge>
                      </div>
                      
                      {reminder.notes && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          {reminder.notes}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {!isCompleted ? (
                          <Button variant="secondary" onClick={() => handleComplete(reminder.id)} style={{ padding: '0.5rem 1rem' }}>
                            <CheckCircle2 size={16} /> Complete
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={() => handleReopen(reminder.id)} style={{ padding: '0.5rem 1rem' }}>
                            <RotateCcw size={16} /> Reopen
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => handleDelete(reminder.id)} style={{ padding: '0.5rem 1rem' }}>
                          <Trash2 size={16} /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default Reminders;