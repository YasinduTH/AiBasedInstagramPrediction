import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createReminder,
  getUserReminders,
  completeReminder,
  reopenReminder,
  deleteReminder,
} from "../services/reminderService";

// ============================================================
// REMINDERS PAGE
// ============================================================

function Reminders() {
  const navigate = useNavigate();

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // ==========================================================
  // REMINDER STATE
  // ==========================================================

  const [reminders, setReminders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ==========================================================
  // LOAD REMINDERS
  // ==========================================================

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUserReminders();

      setReminders(data);
    } catch (err) {
      console.error("Error loading reminders:", err);

      setError(
        err.message || "Unable to load reminders."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadReminders();
  }, []);

  // ==========================================================
  // CREATE REMINDER
  // ==========================================================

  const handleCreateReminder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await createReminder({
        title,
        date,
        time,
        notes,
      });

      // ------------------------------------------------------
      // CLEAR FORM
      // ------------------------------------------------------

      setTitle("");
      setDate("");
      setTime("");
      setNotes("");

      setSuccess(
        "Reminder created successfully."
      );

      // ------------------------------------------------------
      // REFRESH LIST
      // ------------------------------------------------------

      await loadReminders();

    } catch (err) {
      console.error(
        "Error creating reminder:",
        err
      );

      setError(
        err.message ||
          "Unable to create reminder."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // COMPLETE REMINDER
  // ==========================================================

  const handleComplete = async (id) => {
    try {
      setError("");
      setSuccess("");

      await completeReminder(id);

      setSuccess(
        "Reminder marked as completed."
      );

      await loadReminders();

    } catch (err) {
      console.error(
        "Error completing reminder:",
        err
      );

      setError(
        err.message ||
          "Unable to complete reminder."
      );
    }
  };

  // ==========================================================
  // REOPEN REMINDER
  // ==========================================================

  const handleReopen = async (id) => {
    try {
      setError("");
      setSuccess("");

      await reopenReminder(id);

      setSuccess(
        "Reminder reopened."
      );

      await loadReminders();

    } catch (err) {
      console.error(
        "Error reopening reminder:",
        err
      );

      setError(
        err.message ||
          "Unable to reopen reminder."
      );
    }
  };

  // ==========================================================
  // DELETE REMINDER
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reminder?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteReminder(id);

      setSuccess(
        "Reminder deleted successfully."
      );

      await loadReminders();

    } catch (err) {
      console.error(
        "Error deleting reminder:",
        err
      );

      setError(
        err.message ||
          "Unable to delete reminder."
      );
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "No date";
    }

    try {
      const dateObject = new Date(
        `${dateValue}T00:00:00`
      );

      return dateObject.toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    } catch {
      return dateValue;
    }
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "No time";
    }

    try {
      const [hours, minutes] =
        timeValue.split(":");

      const dateObject = new Date();

      dateObject.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );

      return dateObject.toLocaleTimeString(
        undefined,
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    } catch {
      return timeValue;
    }
  };

  // ==========================================================
  // CHECK WHETHER REMINDER IS PAST
  // ==========================================================

  const isPastReminder = (reminder) => {
    if (
      !reminder.date ||
      !reminder.time ||
      reminder.completed
    ) {
      return false;
    }

    const reminderDate = new Date(
      `${reminder.date}T${reminder.time}`
    );

    return reminderDate < new Date();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={styles.page}>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div style={styles.header}>

        <div>

          <div style={styles.eyebrow}>
            AI-POWERED INSTAGRAM ANALYTICS
          </div>

          <h1 style={styles.title}>
            Instagram Post Reminders
          </h1>

          <p style={styles.subtitle}>
            Schedule reminders for your upcoming
            Instagram content.
          </p>

        </div>

        <button
          style={styles.dashboardButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </div>


      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <div style={styles.content}>

        {/* ==================================================
            CREATE REMINDER
        ================================================== */}

        <section style={styles.card}>

          <h2 style={styles.cardTitle}>
            Create a New Reminder
          </h2>

          <p style={styles.cardDescription}>
            Plan when you want to publish your
            Instagram content.
          </p>

          <form
            onSubmit={handleCreateReminder}
          >

            {/* TITLE */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Reminder Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Publish travel post"
                style={styles.input}
                required
              />

            </div>


            {/* DATE + TIME */}

            <div style={styles.formRow}>

              <div style={styles.formGroup}>

                <label style={styles.label}>
                  Date *
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  style={styles.input}
                  required
                />

              </div>


              <div style={styles.formGroup}>

                <label style={styles.label}>
                  Time *
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  style={styles.input}
                  required
                />

              </div>

            </div>


            {/* NOTES */}

            <div style={styles.formGroup}>

              <label style={styles.label}>
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Optional notes about this post..."
                rows="4"
                style={styles.textarea}
              />

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.primaryButton,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "Creating..."
                : "+ Create Reminder"}
            </button>

          </form>

        </section>


        {/* ==================================================
            MESSAGES
        ================================================== */}

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={styles.successMessage}>
            ✓ {success}
          </div>
        )}


        {/* ==================================================
            REMINDER LIST
        ================================================== */}

        <section style={styles.card}>

          <div style={styles.listHeader}>

            <div>

              <h2 style={styles.cardTitle}>
                Your Reminders
              </h2>

              <p style={styles.cardDescription}>
                Manage your upcoming Instagram
                content reminders.
              </p>

            </div>

            <button
              onClick={loadReminders}
              style={styles.refreshButton}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>


          {/* LOADING */}

          {loading && (
            <div style={styles.emptyState}>
              Loading reminders...
            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            reminders.length === 0 && (
              <div style={styles.emptyState}>

                <div style={styles.emptyIcon}>
                  📅
                </div>

                <h3>
                  No reminders yet
                </h3>

                <p>
                  Create your first Instagram
                  post reminder above.
                </p>

              </div>
            )}


          {/* REMINDERS */}

          {!loading &&
            reminders.length > 0 && (

              <div style={styles.reminderList}>

                {reminders.map((reminder) => {

                  const past =
                    isPastReminder(reminder);

                  return (
                    <div
                      key={reminder.id}
                      style={{
                        ...styles.reminderCard,

                        opacity:
                          reminder.completed
                            ? 0.65
                            : 1,

                      }}
                    >

                      {/* TOP */}

                      <div style={styles.reminderTop}>

                        <div>

                          <h3
                            style={{
                              ...styles.reminderTitle,

                              textDecoration:
                                reminder.completed
                                  ? "line-through"
                                  : "none",
                            }}
                          >
                            {reminder.title}
                          </h3>

                          <div
                            style={styles.dateTime}
                          >
                            📅{" "}
                            {formatDate(
                              reminder.date
                            )}

                            <span>
                              •
                            </span>

                            ⏰{" "}
                            {formatTime(
                              reminder.time
                            )}
                          </div>

                        </div>


                        {/* STATUS */}

                        <span
                          style={{
                            ...styles.status,

                            ...(reminder.completed
                              ? styles.completedStatus
                              : past
                              ? styles.pastStatus
                              : styles.pendingStatus),
                          }}
                        >
                          {reminder.completed
                            ? "Completed"
                            : past
                            ? "Past"
                            : "Upcoming"}
                        </span>

                      </div>


                      {/* NOTES */}

                      {reminder.notes && (
                        <div style={styles.notes}>
                          <strong>
                            Notes:
                          </strong>{" "}
                          {reminder.notes}
                        </div>
                      )}


                      {/* ACTIONS */}

                      <div style={styles.actions}>

                        {!reminder.completed ? (
                          <button
                            onClick={() =>
                              handleComplete(
                                reminder.id
                              )
                            }
                            style={
                              styles.completeButton
                            }
                          >
                            ✓ Complete
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleReopen(
                                reminder.id
                              )
                            }
                            style={
                              styles.reopenButton
                            }
                          >
                            ↩ Reopen
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleDelete(
                              reminder.id
                            )
                          }
                          style={styles.deleteButton}
                        >
                          🗑 Delete
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </section>

      </div>

    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#0f172a",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    padding: "50px 20px 80px",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "30px",
  },

  eyebrow: {
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "2px",
    marginBottom: "10px",
  },

  title: {
    color: "#ffffff",
    fontSize: "36px",
    margin: "0 0 8px",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "16px",
    margin: 0,
  },

  dashboardButton: {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  content: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "25px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.2)",
  },

  cardTitle: {
    margin: "0 0 7px",
    fontSize: "23px",
    color: "#0f172a",
  },

  cardDescription: {
    color: "#64748b",
    margin: "0 0 25px",
    fontSize: "14px",
  },

  formGroup: {
    marginBottom: "20px",
    flex: 1,
  },

  formRow: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "15px",
    outline: "none",
    background: "#f8fafc",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    background: "#f8fafc",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  errorMessage: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "14px 18px",
    fontSize: "14px",
    fontWeight: "600",
  },

  successMessage: {
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: "8px",
    padding: "14px 18px",
    fontSize: "14px",
    fontWeight: "600",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  refreshButton: {
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    borderRadius: "8px",
    padding: "10px 15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  emptyState: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  reminderList: {
    display: "grid",
    gap: "15px",
  },

  reminderCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    background: "#f8fafc",
  },

  reminderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  reminderTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    color: "#0f172a",
  },

  dateTime: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
  },

  status: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  pendingStatus: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  pastStatus: {
    background: "#fef3c7",
    color: "#92400e",
  },

  completedStatus: {
    background: "#dcfce7",
    color: "#15803d",
  },

  notes: {
    marginTop: "15px",
    padding: "12px",
    background: "#ffffff",
    borderRadius: "8px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },

  completeButton: {
    border: "none",
    borderRadius: "7px",
    padding: "9px 14px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  reopenButton: {
    border: "1px solid #2563eb",
    borderRadius: "7px",
    padding: "9px 14px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "600",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #fecaca",
    borderRadius: "7px",
    padding: "9px 14px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Reminders;