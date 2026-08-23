import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";

import {
  getAdminUsers,
  deleteAdminUser,
} from "../services/adminService";

function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUid, setDeletingUid] = useState(null);

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminUsers();

      /*
        Support common API response formats:
        
        {
          users: [...]
        }

        OR

        [...]
      */

      const userList = Array.isArray(result)
        ? result
        : result.users || [];

      setUsers(userList);

    } catch (err) {
      console.error(
        "Admin users loading error:",
        err
      );

      setError(
        err.message ||
        "Unable to load users."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadUsers();
  }, []);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredUsers = useMemo(() => {

    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return users;
    }

    return users.filter((item) => {

      const fullName =
        item.fullName ||
        item.displayName ||
        "";

      const email =
        item.email ||
        "";

      const instagram =
        item.instagramProfile ||
        item.instagramUsername ||
        "";

      const uid =
        item.uid ||
        item.id ||
        "";

      return (
        fullName
          .toLowerCase()
          .includes(searchText) ||

        email
          .toLowerCase()
          .includes(searchText) ||

        instagram
          .toLowerCase()
          .includes(searchText) ||

        uid
          .toLowerCase()
          .includes(searchText)
      );
    });

  }, [users, search]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalUsers = users.length;

  const totalPredictions = users.reduce(
    (total, item) =>
      total +
      Number(
        item.predictionCount ||
        item.predictionsCount ||
        0
      ),
    0
  );

  const totalReminders = users.reduce(
    (total, item) =>
      total +
      Number(
        item.reminderCount ||
        item.remindersCount ||
        0
      ),
    0
  );

  const adminUsers = users.filter(
    (item) => item.admin === true
  ).length;

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDeleteUser = async (item) => {

    const uid =
      item.uid ||
      item.id;

    if (!uid) {
      alert("User ID was not found.");
      return;
    }

    const name =
      item.fullName ||
      item.displayName ||
      item.email ||
      "this user";

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${name}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingUid(uid);
    setError("");

    try {

      await deleteAdminUser(uid);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            (currentUser.uid || currentUser.id) !== uid
        )
      );

      if (
        selectedUser &&
        (selectedUser.uid || selectedUser.id) === uid
      ) {
        setSelectedUser(null);
      }

    } catch (err) {

      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.message ||
        "Unable to delete user."
      );

    } finally {
      setDeletingUid(null);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {

    try {

      await signOut(auth);

      navigate("/login");

    } catch (err) {

      console.error(
        "Logout error:",
        err
      );

      setError(
        "Unable to logout."
      );
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (value) => {

    if (!value) {
      return "N/A";
    }

    try {

      if (
        typeof value === "object" &&
        value.seconds
      ) {
        return new Date(
          value.seconds * 1000
        ).toLocaleDateString();
      }

      return new Date(value).toLocaleDateString();

    } catch {
      return String(value);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={styles.page}>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header style={styles.header}>

        <div>
          <div style={styles.brand}>
            AI-POWERED INSTAGRAM ANALYTICS
          </div>

          <h1 style={styles.title}>
            Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Manage users and monitor the Instagram
            prediction system.
          </p>
        </div>

        <div style={styles.headerActions}>

          <button
            style={styles.refreshButton}
            onClick={loadUsers}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div style={styles.error}>
          ⚠ {error}
        </div>
      )}


      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <section style={styles.statsGrid}>

        <StatCard
          icon="👥"
          title="Total Users"
          value={totalUsers}
          description="Registered users"
        />

        <StatCard
          icon="📊"
          title="Predictions"
          value={totalPredictions}
          description="Total predictions"
        />

        <StatCard
          icon="⏰"
          title="Reminders"
          value={totalReminders}
          description="Total reminders"
        />

        <StatCard
          icon="🛡️"
          title="Administrators"
          value={adminUsers}
          description="Admin accounts"
        />

      </section>


      {/* ====================================================
          USER MANAGEMENT
      ==================================================== */}

      <section style={styles.card}>

        <div style={styles.sectionHeader}>

          <div>
            <h2 style={styles.sectionTitle}>
              User Management
            </h2>

            <p style={styles.sectionSubtitle}>
              View and manage registered users.
            </p>
          </div>

          <div style={styles.userCount}>
            {filteredUsers.length} users
          </div>

        </div>


        {/* SEARCH */}

        <div style={styles.searchRow}>

          <input
            type="text"
            placeholder="Search by name, email, Instagram or user ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={styles.searchInput}
          />

        </div>


        {/* ==================================================
            USERS TABLE
        ================================================== */}

        {loading ? (

          <div style={styles.loading}>
            Loading users...
          </div>

        ) : filteredUsers.length === 0 ? (

          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              👥
            </div>

            <h3>
              No users found
            </h3>

            <p>
              There are no users matching your search.
            </p>
          </div>

        ) : (

          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    User
                  </th>

                  <th style={styles.th}>
                    Email
                  </th>

                  <th style={styles.th}>
                    Date of Birth
                  </th>

                  <th style={styles.th}>
                    Instagram
                  </th>

                  <th style={styles.th}>
                    Predictions
                  </th>

                  <th style={styles.th}>
                    Reminders
                  </th>

                  <th style={styles.th}>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((item) => {

                  const uid =
                    item.uid ||
                    item.id;

                  const name =
                    item.fullName ||
                    item.displayName ||
                    "Unnamed User";

                  const instagram =
                    item.instagramProfile ||
                    item.instagramUsername ||
                    "";

                  const predictionCount =
                    item.predictionCount ||
                    item.predictionsCount ||
                    0;

                  const reminderCount =
                    item.reminderCount ||
                    item.remindersCount ||
                    0;

                  return (

                    <tr
                      key={uid}
                      style={styles.tr}
                    >

                      <td style={styles.td}>

                        <div style={styles.userCell}>

                          <div style={styles.avatar}>
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {name}
                            </strong>

                            {item.admin === true && (
                              <span style={styles.adminBadge}>
                                ADMIN
                              </span>
                            )}

                          </div>

                        </div>

                      </td>


                      <td style={styles.td}>
                        {item.email || "N/A"}
                      </td>


                      <td style={styles.td}>
                        {item.dateOfBirth || "N/A"}
                      </td>


                      <td style={styles.td}>

                        {instagram ? (

                          <a
                            href={instagram}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.instagramLink}
                          >
                            ◎ Open Instagram ↗
                          </a>

                        ) : (
                          "N/A"
                        )}

                      </td>


                      <td style={styles.td}>
                        {predictionCount}
                      </td>


                      <td style={styles.td}>
                        {reminderCount}
                      </td>


                      <td style={styles.td}>

                        <div style={styles.actionButtons}>

                          <button
                            style={styles.viewButton}
                            onClick={() =>
                              setSelectedUser(item)
                            }
                          >
                            View
                          </button>

                          <button
                            style={styles.deleteButton}
                            disabled={
                              deletingUid === uid
                            }
                            onClick={() =>
                              handleDeleteUser(item)
                            }
                          >
                            {deletingUid === uid
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ====================================================
          USER DETAILS MODAL
      ==================================================== */}

      {selectedUser && (

        <div
          style={styles.modalOverlay}
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            style={styles.modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div style={styles.modalHeader}>

              <div>

                <div style={styles.brand}>
                  USER DETAILS
                </div>

                <h2 style={styles.modalTitle}>
                  {selectedUser.fullName ||
                    selectedUser.displayName ||
                    "User"}
                </h2>

              </div>

              <button
                style={styles.closeButton}
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                ×
              </button>

            </div>


            <div style={styles.detailsGrid}>

              <Detail
                label="Full Name"
                value={
                  selectedUser.fullName ||
                  selectedUser.displayName ||
                  "N/A"
                }
              />

              <Detail
                label="Email"
                value={
                  selectedUser.email ||
                  "N/A"
                }
              />

              <Detail
                label="Date of Birth"
                value={
                  selectedUser.dateOfBirth ||
                  "N/A"
                }
              />

              <Detail
                label="Instagram Profile"
                value={
                  selectedUser.instagramProfile ||
                  "N/A"
                }
              />

              <Detail
                label="User ID"
                value={
                  selectedUser.uid ||
                  selectedUser.id ||
                  "N/A"
                }
              />

              <Detail
                label="Created"
                value={formatDate(
                  selectedUser.createdAt
                )}
              />

              <Detail
                label="Predictions"
                value={
                  selectedUser.predictionCount ||
                  selectedUser.predictionsCount ||
                  0
                }
              />

              <Detail
                label="Reminders"
                value={
                  selectedUser.reminderCount ||
                  selectedUser.remindersCount ||
                  0
                }
              />

            </div>


            {selectedUser.instagramProfile && (

              <a
                href={
                  selectedUser.instagramProfile
                }
                target="_blank"
                rel="noreferrer"
                style={styles.openInstagram}
              >
                ◎ Open Instagram Profile ↗
              </a>

            )}


            <div style={styles.modalActions}>

              <button
                style={styles.secondaryButton}
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                Close
              </button>

              <button
                style={styles.deleteButtonLarge}
                onClick={() =>
                  handleDeleteUser(
                    selectedUser
                  )
                }
              >
                🗑 Delete User
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  title,
  value,
  description,
}) {

  return (

    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>

        <div style={styles.statTitle}>
          {title}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>

        <div style={styles.statDescription}>
          {description}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// DETAIL
// ============================================================

function Detail({
  label,
  value,
}) {

  return (

    <div style={styles.detailItem}>

      <div style={styles.detailLabel}>
        {label}
      </div>

      <div style={styles.detailValue}>
        {value}
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
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    padding: "40px",
    boxSizing: "border-box",
  },

  header: {
    maxWidth: "1400px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "30px",
  },

  brand: {
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "2px",
    marginBottom: "8px",
  },

  title: {
    margin: "0",
    fontSize: "38px",
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "10px",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  refreshButton: {
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  logoutButton: {
    border: "1px solid #991b1b",
    background: "#7f1d1d",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  error: {
    maxWidth: "1400px",
    margin: "0 auto 20px",
    padding: "14px",
    borderRadius: "8px",
    background: "#7f1d1d",
    color: "#fecaca",
  },

  statsGrid: {
    maxWidth: "1400px",
    margin: "0 auto 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  statCard: {
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.18)",
  },

  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },

  statTitle: {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
  },

  statValue: {
    fontSize: "30px",
    fontWeight: "700",
    marginTop: "3px",
  },

  statDescription: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "3px",
  },

  card: {
    maxWidth: "1400px",
    margin: "0 auto",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.2)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: "0",
    fontSize: "24px",
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
  },

  userCount: {
    background: "#eff6ff",
    color: "#2563eb",
    padding: "8px 14px",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "13px",
  },

  searchRow: {
    marginBottom: "20px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    fontSize: "15px",
    outline: "none",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    borderBottom: "1px solid #e2e8f0",
  },

  tr: {
    borderBottom: "1px solid #e2e8f0",
  },

  td: {
    padding: "16px 14px",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "180px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  adminBadge: {
    marginLeft: "8px",
    fontSize: "9px",
    background: "#ede9fe",
    color: "#7c3aed",
    padding: "3px 6px",
    borderRadius: "5px",
    fontWeight: "700",
  },

  instagramLink: {
    color: "#db2777",
    textDecoration: "none",
    fontWeight: "600",
  },

  actionButtons: {
    display: "flex",
    gap: "7px",
  },

  viewButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
  },

  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    padding: "8px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
  },

  loading: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b",
  },

  empty: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "40px",
  },

  modalOverlay: {
    position: "fixed",
    inset: "0",
    background: "rgba(15,23,42,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "700px",
    maxWidth: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "30px",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "20px",
    marginBottom: "22px",
  },

  modalTitle: {
    margin: "0",
    fontSize: "26px",
  },

  closeButton: {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "24px",
    cursor: "pointer",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  },

  detailItem: {
    background: "#f8fafc",
    borderRadius: "9px",
    padding: "15px",
  },

  detailLabel: {
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "6px",
  },

  detailValue: {
    fontWeight: "600",
    wordBreak: "break-word",
  },

  openInstagram: {
    display: "inline-block",
    marginTop: "20px",
    color: "#db2777",
    fontWeight: "700",
    textDecoration: "none",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
  },

  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  deleteButtonLarge: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

};

export default AdminDashboard;