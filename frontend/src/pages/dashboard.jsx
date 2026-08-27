import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  BarChart2, 
  TrendingUp, 
  Image as ImageIcon, 
  Target, 
  Plus,
  ArrowRight,
  ExternalLink,
  Calendar,
  AtSign,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock
} from "lucide-react";

import { auth, db } from "../firebase";
import { getUserPredictions, calculateDashboardAnalytics } from "../services/dashboardAnalyticsService";
import { getUserReminders } from "../services/reminderService";

import Layout from "../components/Layout";
import Button from "../components/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../components/Card";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Edit Profile States
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editInstagramProfile, setEditInstagramProfile] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("");

  // Load User Profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      try {
        setProfileLoading(true);
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          setProfile(userSnapshot.data());
        } else {
          setProfile({
            email: user.email || "",
            fullName: "",
            dateOfBirth: "",
            instagramProfile: "",
          });
        }
      } catch (err) {
        console.error("User profile loading error:", err);
        setProfile({
          email: user.email || "",
          fullName: "",
          dateOfBirth: "",
          instagramProfile: "",
        });
      } finally {
        setProfileLoading(false);
      }
    };
    loadUserProfile();
  }, [user?.uid, user?.email]);

  // Load Predictions & Reminders
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setPredictions([]);
        setReminders([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const [records, userReminders] = await Promise.all([
          getUserPredictions(user.uid),
          getUserReminders()
        ]);
        setPredictions(records);
        setReminders(userReminders);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError("Unable to load your dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.uid]);

  const statistics = useMemo(() => calculateDashboardAnalytics(predictions), [predictions]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to logout. Please try again.");
    }
  };

  const goToPrediction = () => navigate("/prediction");
  const goToHistory = () => navigate("/history");
  const goToReminders = () => navigate("/reminders");

  const openInstagramProfile = () => {
    const instagramProfile = profile?.instagramProfile;
    if (!instagramProfile) return;
    let url = instagramProfile.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.startsWith("@")) url = url.substring(1);
      url = `https://www.instagram.com/${url}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEditProfile = () => {
    setEditFullName(profile?.fullName || "");
    setEditDateOfBirth(profile?.dateOfBirth || "");
    setEditInstagramProfile(profile?.instagramProfile || "");
    setProfileMessage("");
    setProfileMessageType("");
    setEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setProfileMessage("");
    setProfileMessageType("");
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      setProfileMessage("You must be logged in to update your profile.");
      setProfileMessageType("error");
      return;
    }

    if (!editFullName.trim()) {
      setProfileMessage("Full name is required.");
      setProfileMessageType("error");
      return;
    }
    if (!editDateOfBirth) {
      setProfileMessage("Date of birth is required.");
      setProfileMessageType("error");
      return;
    }
    if (!editInstagramProfile.trim()) {
      setProfileMessage("Instagram profile link is required.");
      setProfileMessageType("error");
      return;
    }

    let instagramUrl = editInstagramProfile.trim();
    if (!instagramUrl.startsWith("http://") && !instagramUrl.startsWith("https://")) {
      if (instagramUrl.startsWith("@")) instagramUrl = instagramUrl.substring(1);
      instagramUrl = `https://www.instagram.com/${instagramUrl}`;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setProfileMessageType("");
      
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fullName: editFullName.trim(),
        dateOfBirth: editDateOfBirth,
        instagramProfile: instagramUrl,
        updatedAt: serverTimestamp(),
      });

      setProfile({
        ...profile,
        fullName: editFullName.trim(),
        dateOfBirth: editDateOfBirth,
        instagramProfile: instagramUrl,
      });

      setProfileMessage("Profile updated successfully.");
      setProfileMessageType("success");
      setTimeout(() => setEditingProfile(false), 1500);
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileMessage("Unable to update your profile. Please try again.");
      setProfileMessageType("error");
    } finally {
      setSavingProfile(false);
    }
  };

  const formatDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return "Not provided";
    if (typeof dateOfBirth.toDate === "function") {
      return dateOfBirth.toDate().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    }
    const date = new Date(`${dateOfBirth}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(dateOfBirth);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <Layout isAdmin={false} title="Dashboard" user={user} profile={profile} onLogout={handleLogout}>
        <LoadingSpinner fullScreen={false} text="Loading your dashboard analytics..." />
      </Layout>
    );
  }

  const optimization = statistics.optimization || {};

  return (
    <Layout 
      isAdmin={false} 
      title="Overview" 
      subtitle="Analyze your prediction performance and optimize your content."
      user={user} 
      profile={profile} 
      onLogout={handleLogout}
      onEditProfile={handleEditProfile}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Quick Actions & Welcome */}
        <div className="mobile-col" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(139, 92, 246, 0.05) 100%)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
              Welcome back, {profileLoading ? "..." : (profile?.fullName?.split(' ')[0] || "User")}! 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
              Ready to predict engagement for your next Instagram post?
            </p>
          </div>
          <div className="mobile-w-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: '600', backgroundColor: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', width: 'fit-content', border: '1px solid var(--border-light)' }}>
              <Clock size={16} />
              <span>{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {profile?.instagramProfile && (
                <Button variant="secondary" onClick={openInstagramProfile} className="mobile-w-full">
                  <ExternalLink size={18} />
                  View Instagram
                </Button>
              )}
              <Button variant="primary" onClick={goToPrediction} className="mobile-w-full">
                <Plus size={18} />
                New Prediction
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Error: </strong> {error}
          </div>
        )}

        {/* Statistics Grid */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Prediction Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <StatCard title="Total Predictions" value={statistics.total} icon={BarChart2} />
            
            <Card>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                    Engagement Levels
                  </p>
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color="var(--accent-primary)" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)', margin: 0 }}>{statistics.high}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--success)', margin: '0.25rem 0 0 0', fontWeight: '600' }}>High</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)', margin: 0 }}>{statistics.medium}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--warning)', margin: '0.25rem 0 0 0', fontWeight: '600' }}>Med</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--error)', margin: 0 }}>{statistics.low}</p>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--error)', margin: '0.25rem 0 0 0', fontWeight: '600' }}>Low</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <StatCard title="Average Confidence" value={`${(statistics.averageConfidence * 100).toFixed(1)}%`} icon={Target} />
            <StatCard title="Image Predictions" value={statistics.imagePredictions} icon={ImageIcon} />
          </div>
        </div>

        {/* Two Column Layout for Recent & Optimization */}
        <div className="grid-2-col">
          
          {/* Recent Predictions */}
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Recent Predictions</CardTitle>
              {predictions.length > 0 && (
                <Button variant="ghost" onClick={goToHistory} style={{ padding: '0.5rem' }}>
                  View All <ArrowRight size={16} />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>You haven't created any predictions yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {predictions.slice(0, 4).map(pred => (
                    <div key={pred.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--bg-tertiary)',
                          backgroundImage: pred.image?.imageUrl ? `url(${pred.image.imageUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {!pred.image?.imageUrl && <ImageIcon size={20} color="var(--text-muted)" />}
                        </div>
                        <div>
                          <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>
                            {pred.userInput?.category || "Uncategorized"}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                            {new Date(pred.createdAt?.toDate ? pred.createdAt.toDate() : pred.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={pred.prediction === 'High' ? 'success' : pred.prediction === 'Medium' ? 'warning' : 'error'}>
                        {pred.prediction || "Unknown"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Content Optimization Quality</CardTitle>
            </CardHeader>
            <CardContent>
              {!optimization.available ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <Lightbulb size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No optimization data available yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Average Score</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {Number(optimization.averageScore || 0).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.max(0, Math.min(Number(optimization.averageScore || 0), 100))}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-primary)',
                      borderRadius: '4px'
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <p style={{ color: 'var(--success)', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Good</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{optimization.good}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <p style={{ color: 'var(--warning)', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}><AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Moderate</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{optimization.moderate}</p>
                    </div>
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
          </div>

        {/* Reminders Section */}
        <div>
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Upcoming Reminders</CardTitle>
              {reminders.filter(r => !r.completed).length > 0 && (
                <Button variant="ghost" onClick={goToReminders} style={{ padding: '0.5rem' }}>
                  View All <ArrowRight size={16} />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {reminders.filter(r => !r.completed).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No upcoming reminders.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {reminders.filter(r => !r.completed).slice(0, 3).map(reminder => (
                    <div key={reminder.id} style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ backgroundColor: 'var(--info-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <Calendar size={24} color="var(--info)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{reminder.title}</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> {reminder.date} at {reminder.time}
                        </p>
                        {reminder.predictedPost?.prediction && (
                          <div style={{ display: 'flex' }}>
                             <Badge variant={reminder.predictedPost.prediction === 'High' ? 'success' : reminder.predictedPost.prediction === 'Medium' ? 'warning' : 'error'}>
                               {reminder.predictedPost.prediction} Expected
                             </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Edit Profile Modal */}
      <Modal
        isOpen={editingProfile}
        onClose={handleCancelEdit}
        title="Edit Profile"
        footer={
          <>
            <Button variant="ghost" onClick={handleCancelEdit} disabled={savingProfile}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {profileMessage && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: profileMessageType === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
              color: profileMessageType === 'error' ? 'var(--error)' : 'var(--success)',
              border: `1px solid ${profileMessageType === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              {profileMessage}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Full Name</label>
            <input 
              type="text" 
              value={editFullName} 
              onChange={(e) => setEditFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Date of Birth</label>
            <input 
              type="date" 
              value={editDateOfBirth} 
              onChange={(e) => setEditDateOfBirth(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Instagram Profile Link</label>
            <input 
              type="text" 
              value={editInstagramProfile} 
              onChange={(e) => setEditInstagramProfile(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              placeholder="https://www.instagram.com/username/"
            />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Example: https://www.instagram.com/username/</p>
          </div>
          
          {profile?.instagramProfile && (
             <div style={{ marginTop: '0.5rem' }}>
                <Button variant="secondary" onClick={openInstagramProfile}>
                  <ExternalLink size={16} /> Open Current Profile
                </Button>
             </div>
          )}
        </div>
      </Modal>

    </Layout>
  );
}

export default Dashboard;