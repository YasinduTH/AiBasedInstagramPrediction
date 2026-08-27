import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BarChart2, 
  Bell, 
  ShieldAlert, 
  Search, 
  Eye, 
  Trash2, 
  ExternalLink,
  RefreshCcw,
  Mail,
  Calendar,
  AtSign
} from "lucide-react";

import { auth } from "../firebase";
import { getAdminUsers, deleteAdminUser } from "../services/adminService";

import Layout from "../components/Layout";
import Button from "../components/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../components/Card";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";

function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUid, setDeletingUid] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminUsers();
      const userList = Array.isArray(result) ? result : result.users || [];
      setUsers(userList);
    } catch (err) {
      console.error("Admin users loading error:", err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return users;

    return users.filter((item) => {
      const fullName = (item.fullName || item.displayName || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const instagram = (item.instagramProfile || item.instagramUsername || "").toLowerCase();
      const uid = (item.uid || item.id || "").toLowerCase();

      return fullName.includes(searchText) || email.includes(searchText) || instagram.includes(searchText) || uid.includes(searchText);
    });
  }, [users, search]);

  const totalUsers = users.length;
  const totalPredictions = users.reduce((total, item) => total + Number(item.predictionCount || item.predictionsCount || 0), 0);
  const totalReminders = users.reduce((total, item) => total + Number(item.reminderCount || item.remindersCount || 0), 0);
  const adminUsers = users.filter((item) => item.admin === true).length;

  const handleDeleteUser = async (item) => {
    const uid = item.uid || item.id;
    if (!uid) {
      alert("User ID was not found.");
      return;
    }

    const name = item.fullName || item.displayName || item.email || "this user";
    const confirmed = window.confirm(`Are you sure you want to permanently delete ${name}?`);
    if (!confirmed) return;

    setDeletingUid(uid);
    setError("");

    try {
      await deleteAdminUser(uid);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => (currentUser.uid || currentUser.id) !== uid));
      if (selectedUser && (selectedUser.uid || selectedUser.id) === uid) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.message || "Unable to delete user.");
    } finally {
      setDeletingUid(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to logout.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      if (typeof value === "object" && value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString();
      }
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value);
    }
  };

  return (
    <Layout 
      isAdmin={true} 
      title="Admin Dashboard" 
      subtitle="Manage users and monitor the Instagram prediction system."
      user={user}
      onLogout={handleLogout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <StatCard title="Total Users" value={totalUsers} icon={Users} />
          <StatCard title="Total Predictions" value={totalPredictions} icon={BarChart2} />
          <StatCard title="Total Reminders" value={totalReminders} icon={Bell} />
          <StatCard title="Administrators" value={adminUsers} icon={ShieldAlert} />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <CardTitle>User Management</CardTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    minWidth: '250px'
                  }}
                />
              </div>
              <Button variant="secondary" onClick={loadUsers} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '3rem' }}>
                <LoadingSpinner text="Loading users..." />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No users match your search.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>User</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contact</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Activity</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => {
                      const uid = item.uid || item.id;
                      const name = item.fullName || item.displayName || "Unnamed User";
                      const predictionCount = item.predictionCount || item.predictionsCount || 0;
                      const reminderCount = item.reminderCount || item.remindersCount || 0;

                      return (
                        <tr key={uid} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'var(--accent-primary)' }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {name}
                                  {item.admin && <Badge variant="primary">Admin</Badge>}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {uid.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <p style={{ margin: 0, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={14} color="var(--text-muted)" /> {item.email || "N/A"}
                              </p>
                              {item.instagramProfile && (
                                <a href={item.instagramProfile} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <AtSign size={14} color="var(--accent-primary)" /> Profile
                                </a>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BarChart2 size={14} color="var(--text-muted)"/> {predictionCount}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Bell size={14} color="var(--text-muted)"/> {reminderCount}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <Button variant="secondary" onClick={() => setSelectedUser(item)} style={{ padding: '0.5rem' }}>
                                <Eye size={16} />
                              </Button>
                              <Button variant="danger" disabled={deletingUid === uid} onClick={() => handleDeleteUser(item)} style={{ padding: '0.5rem' }}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedUser(null)}>Close</Button>
            <Button variant="danger" onClick={() => { handleDeleteUser(selectedUser); setSelectedUser(null); }}>
              <Trash2 size={16} /> Delete User
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {(selectedUser.fullName || selectedUser.displayName || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedUser.fullName || selectedUser.displayName || "Unnamed User"}
                  {selectedUser.admin && <Badge variant="primary">Admin</Badge>}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date of Birth</p>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.dateOfBirth || "N/A"}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</p>
                <p style={{ margin: 0, fontWeight: '500' }}>{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predictions</p>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.predictionCount || selectedUser.predictionsCount || 0}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reminders</p>
                <p style={{ margin: 0, fontWeight: '500' }}>{selectedUser.reminderCount || selectedUser.remindersCount || 0}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</p>
                <p style={{ margin: 0, fontWeight: '500', fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedUser.uid || selectedUser.id}</p>
              </div>
            </div>

            {selectedUser.instagramProfile && (
              <a 
                href={selectedUser.instagramProfile} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontWeight: '500', transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              >
                <ExternalLink size={18} /> Open Instagram Profile
              </a>
            )}
          </div>
        )}
      </Modal>

    </Layout>
  );
}

export default AdminDashboard;