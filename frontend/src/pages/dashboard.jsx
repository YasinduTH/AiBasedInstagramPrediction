import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

import {
  getUserPredictions,
  calculateDashboardAnalytics,
} from "../services/dashboardAnalyticsService";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // EDIT PROFILE STATES
  // =========================================================

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [editFullName, setEditFullName] =
    useState("");

  const [editDateOfBirth, setEditDateOfBirth] =
    useState("");

  const [editInstagramProfile, setEditInstagramProfile] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileMessageType, setProfileMessageType] =
    useState("");

  // =========================================================
  // LOAD USER PROFILE
  // =========================================================

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnapshot =
          await getDoc(userRef);

        if (userSnapshot.exists()) {
          setProfile(
            userSnapshot.data()
          );
        } else {
          setProfile({
            email: user.email || "",
            fullName: "",
            dateOfBirth: "",
            instagramProfile: "",
          });
        }
      } catch (err) {
        console.error(
          "User profile loading error:",
          err
        );

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

  // =========================================================
  // LOAD USER PREDICTION HISTORY
  // =========================================================

  useEffect(() => {
    const loadPredictions = async () => {
      if (!user?.uid) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const records =
          await getUserPredictions(
            user.uid
          );

        setPredictions(records);
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load your prediction analytics. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [user?.uid]);

  // =========================================================
  // DASHBOARD STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    return calculateDashboardAnalytics(
      predictions
    );
  }, [predictions]);

  // =========================================================
  // LOGOUT
  // =========================================================

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
        "Unable to logout. Please try again."
      );
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToPrediction = () => {
    navigate("/prediction");
  };

  const goToHistory = () => {
    navigate("/history");
  };

  // =========================================================
  // OPEN INSTAGRAM PROFILE
  // =========================================================

  const openInstagramProfile = () => {
    const instagramProfile =
      profile?.instagramProfile;

    if (!instagramProfile) {
      return;
    }

    let url =
      instagramProfile.trim();

    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://")
    ) {
      if (url.startsWith("@")) {
        url = url.substring(1);
      }

      url =
        `https://www.instagram.com/${url}`;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================================
  // START EDIT PROFILE
  // =========================================================

  const handleEditProfile = () => {
    setEditFullName(
      profile?.fullName || ""
    );

    setEditDateOfBirth(
      profile?.dateOfBirth || ""
    );

    setEditInstagramProfile(
      profile?.instagramProfile || ""
    );

    setProfileMessage("");
    setProfileMessageType("");

    setEditingProfile(true);
  };

  // =========================================================
  // CANCEL EDIT PROFILE
  // =========================================================

  const handleCancelEdit = () => {
    setEditingProfile(false);

    setProfileMessage("");
    setProfileMessageType("");
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      setProfileMessage(
        "You must be logged in to update your profile."
      );

      setProfileMessageType("error");

      return;
    }

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!editFullName.trim()) {
      setProfileMessage(
        "Full name is required."
      );

      setProfileMessageType("error");

      return;
    }

    if (!editDateOfBirth) {
      setProfileMessage(
        "Date of birth is required."
      );

      setProfileMessageType("error");

      return;
    }

    if (!editInstagramProfile.trim()) {
      setProfileMessage(
        "Instagram profile link is required."
      );

      setProfileMessageType("error");

      return;
    }

    // -------------------------------------------------------
    // VALIDATE INSTAGRAM LINK
    // -------------------------------------------------------

    let instagramUrl =
      editInstagramProfile.trim();

    if (
      !instagramUrl.startsWith(
        "http://"
      ) &&
      !instagramUrl.startsWith(
        "https://"
      )
    ) {
      if (
        instagramUrl.startsWith("@")
      ) {
        instagramUrl =
          instagramUrl.substring(1);
      }

      instagramUrl =
        `https://www.instagram.com/${instagramUrl}`;
    }

    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    try {
      setSavingProfile(true);

      setProfileMessage("");
      setProfileMessageType("");

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await updateDoc(
        userRef,
        {
          fullName:
            editFullName.trim(),

          dateOfBirth:
            editDateOfBirth,

          instagramProfile:
            instagramUrl,

          updatedAt:
            serverTimestamp(),
        }
      );

      // -----------------------------------------------------
      // UPDATE LOCAL PROFILE
      // -----------------------------------------------------

      setProfile({
        ...profile,

        fullName:
          editFullName.trim(),

        dateOfBirth:
          editDateOfBirth,

        instagramProfile:
          instagramUrl,
      });

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setProfileMessage(
        "Profile updated successfully."
      );

      setProfileMessageType(
        "success"
      );

      setEditingProfile(false);

    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setProfileMessage(
        "Unable to update your profile. Please try again."
      );

      setProfileMessageType(
        "error"
      );

    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // FORMAT DATE OF BIRTH
  // =========================================================

  const formatDateOfBirth = (
    dateOfBirth
  ) => {
    if (!dateOfBirth) {
      return "Not provided";
    }

    if (
      typeof dateOfBirth.toDate ===
      "function"
    ) {
      return dateOfBirth
        .toDate()
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        );
    }

    const date = new Date(
      `${dateOfBirth}T00:00:00`
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(dateOfBirth);
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>

          <div
            style={styles.spinner}
          />

          <h2
            style={styles.loadingTitle}
          >
            Loading Dashboard
          </h2>

          <p
            style={styles.loadingText}
          >
            Loading your Instagram prediction analytics...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // OPTIMIZATION ANALYTICS
  // =========================================================

  const optimization =
    statistics.optimization || {};

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div style={styles.container}>

      <div style={styles.dashboard}>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header style={styles.header}>

          <div>

            <p style={styles.eyebrow}>
              AI-POWERED INSTAGRAM ANALYTICS
            </p>

            <h1 style={styles.title}>
              AI Instagram Dashboard
            </h1>

            <p style={styles.subtitle}>
              Analyze your prediction performance and
              optimize your Instagram content.
            </p>

          </div>

          <div
            style={styles.headerActions}
          >

            <button
              style={styles.secondaryButton}
              onClick={goToHistory}
            >
              Prediction History
            </button>

            <button
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </header>

        {/* ================================================= */}
        {/* USER PROFILE */}
        {/* ================================================= */}

        <section
          style={styles.profileSection}
        >

          <div
            style={styles.profileHeader}
          >

            <div
              style={styles.profileAvatar}
            >
              👤
            </div>

            <div
              style={styles.profileHeaderInfo}
            >

              <p
                style={
                  styles.profileEyebrow
                }
              >
                YOUR PROFILE
              </p>

              <h2
                style={styles.profileName}
              >
                {profileLoading
                  ? "Loading profile..."
                  : profile?.fullName ||
                    "Instagram User"}
              </h2>

              <p
                style={styles.profileEmail}
              >
                {profile?.email ||
                  user?.email ||
                  ""}
              </p>

            </div>

            {/* EDIT PROFILE BUTTON */}

            <button
              type="button"
              onClick={
                handleEditProfile
              }
              style={
                styles.editProfileButton
              }
            >
              ✏️ Edit Profile
            </button>

          </div>

          {/* ================================================= */}
          {/* EDIT PROFILE PANEL */}
          {/* ================================================= */}

          {editingProfile && (
            <div
              style={
                styles.editProfilePanel
              }
            >

              <div
                style={
                  styles.editProfileHeader
                }
              >

                <div>

                  <h3
                    style={
                      styles.editProfileTitle
                    }
                  >
                    Edit Profile
                  </h3>

                  <p
                    style={
                      styles.editProfileDescription
                    }
                  >
                    Update your personal and Instagram profile details.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  style={
                    styles.closeEditButton
                  }
                >
                  ×
                </button>

              </div>

              {/* FULL NAME */}

              <label
                style={
                  styles.editLabel
                }
              >
                Full Name
              </label>

              <input
                type="text"
                value={editFullName}
                onChange={(e) =>
                  setEditFullName(
                    e.target.value
                  )
                }
                placeholder="Enter your full name"
                style={
                  styles.editInput
                }
              />

              {/* DATE OF BIRTH */}

              <label
                style={
                  styles.editLabel
                }
              >
                Date of Birth
              </label>

              <input
                type="date"
                value={
                  editDateOfBirth
                }
                onChange={(e) =>
                  setEditDateOfBirth(
                    e.target.value
                  )
                }
                style={
                  styles.editInput
                }
              />

              {/* INSTAGRAM PROFILE */}

              <label
                style={
                  styles.editLabel
                }
              >
                Instagram Profile Link
              </label>

              <input
                type="text"
                value={
                  editInstagramProfile
                }
                onChange={(e) =>
                  setEditInstagramProfile(
                    e.target.value
                  )
                }
                placeholder="https://www.instagram.com/username/"
                style={
                  styles.editInput
                }
              />

              <p
                style={
                  styles.editInputHint
                }
              >
                Example: https://www.instagram.com/username/
              </p>

              {/* MESSAGE */}

              {profileMessage && (
                <div
                  style={{
                    ...styles.profileMessage,

                    ...(profileMessageType ===
                    "success"
                      ? styles.profileSuccessMessage
                      : styles.profileErrorMessage),
                  }}
                >
                  {profileMessage}
                </div>
              )}

              {/* ACTION BUTTONS */}

              <div
                style={
                  styles.editProfileActions
                }
              >

                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={
                    savingProfile
                  }
                  style={
                    styles.cancelEditButton
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveProfile
                  }
                  disabled={
                    savingProfile
                  }
                  style={{
                    ...styles.saveProfileButton,
                    opacity:
                      savingProfile
                        ? 0.7
                        : 1,
                  }}
                >
                  {savingProfile
                    ? "Saving..."
                    : "✓ Save Changes"}
                </button>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* PROFILE DETAILS */}
          {/* ================================================= */}

          <div
            style={styles.profileDetails}
          >

            {/* FULL NAME */}

            <div
              style={styles.profileDetail}
            >

              <span
                style={
                  styles.profileDetailIcon
                }
              >
                👤
              </span>

              <div>

                <span
                  style={
                    styles.profileDetailLabel
                  }
                >
                  Full Name
                </span>

                <strong
                  style={
                    styles.profileDetailValue
                  }
                >
                  {profile?.fullName ||
                    "Not provided"}
                </strong>

              </div>

            </div>

            {/* DATE OF BIRTH */}

            <div
              style={styles.profileDetail}
            >

              <span
                style={
                  styles.profileDetailIcon
                }
              >
                🎂
              </span>

              <div>

                <span
                  style={
                    styles.profileDetailLabel
                  }
                >
                  Date of Birth
                </span>

                <strong
                  style={
                    styles.profileDetailValue
                  }
                >
                  {formatDateOfBirth(
                    profile?.dateOfBirth
                  )}
                </strong>

              </div>

            </div>

            {/* INSTAGRAM */}

            <div
              style={styles.profileDetail}
            >

              <span
                style={
                  styles.instagramIcon
                }
              >
                ◎
              </span>

              <div
                style={
                  styles.instagramDetailContent
                }
              >

                <span
                  style={
                    styles.profileDetailLabel
                  }
                >
                  Instagram Profile
                </span>

                {profile?.instagramProfile ? (

                  <button
                    type="button"
                    onClick={
                      openInstagramProfile
                    }
                    style={
                      styles.instagramButton
                    }
                  >

                    <span>
                      📷
                    </span>

                    <span>
                      Open Instagram
                    </span>

                    <span>
                      ↗
                    </span>

                  </button>

                ) : (

                  <strong
                    style={
                      styles.profileDetailValue
                    }
                  >
                    Not provided
                  </strong>

                )}

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* USER ACCOUNT INFORMATION */}
          {/* ================================================= */}

          <div
            style={styles.accountInformation}
          >

            <div>

              <span
                style={styles.userLabel}
              >
                Email
              </span>

              <strong
                style={styles.userEmail}
              >
                {user?.email ||
                  "User"}
              </strong>

            </div>

            <div
              style={
                styles.userUidContainer
              }
            >

              <span
                style={styles.userLabel}
              >
                User ID
              </span>

              <span
                style={styles.userUid}
              >
                {user?.uid}
              </span>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div style={styles.errorBox}>

            <strong>
              Something went wrong
            </strong>

            <p>
              {error}
            </p>

          </div>
        )}

        {/* ================================================= */}
        {/* QUICK ACTION */}
        {/* ================================================= */}

        <section
          style={styles.actionSection}
        >

          <div>

            <h2
              style={styles.sectionTitle}
            >
              Create a New Prediction
            </h2>

            <p
              style={
                styles.sectionDescription
              }
            >
              Upload your Instagram content and let the AI
              model estimate its engagement level.
            </p>

          </div>

          <button
            style={styles.primaryButton}
            onClick={goToPrediction}
          >
            + New Prediction
          </button>

        </section>

        {/* ================================================= */}
        {/* PREDICTION STATISTICS */}
        {/* ================================================= */}

        <section>

          <div
            style={styles.sectionHeader}
          >

            <div>

              <h2
                style={styles.sectionTitle}
              >
                Prediction Overview
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Statistics calculated from your saved
                prediction history.
              </p>

            </div>

          </div>

          <div
            style={styles.statsGrid}
          >

            <StatCard
              title="Total Predictions"
              value={statistics.total}
              description="Predictions created"
              icon="📊"
            />

            <StatCard
              title="High Engagement"
              value={statistics.high}
              description="High predictions"
              icon="🚀"
              valueStyle={
                styles.highValue
              }
            />

            <StatCard
              title="Medium Engagement"
              value={statistics.medium}
              description="Medium predictions"
              icon="📈"
              valueStyle={
                styles.mediumValue
              }
            />

            <StatCard
              title="Low Engagement"
              value={statistics.low}
              description="Low predictions"
              icon="📉"
              valueStyle={
                styles.lowValue
              }
            />

            <StatCard
              title="Average Confidence"
              value={`${(
                statistics.averageConfidence *
                100
              ).toFixed(2)}%`}
              description="Average AI confidence"
              icon="🎯"
            />

            <StatCard
              title="Image Predictions"
              value={
                statistics.imagePredictions
              }
              description="Predictions with images"
              icon="🖼️"
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* CONTENT OPTIMIZATION ANALYTICS */}
        {/* ================================================= */}

        <section
          style={
            styles.optimizationSection
          }
        >

          <div
            style={
              styles.optimizationHeader
            }
          >

            <div>

              <p
                style={
                  styles.optimizationEyebrow
                }
              >
                AI CONTENT OPTIMIZATION
              </p>

              <h2
                style={styles.sectionTitle}
              >
                Optimization Overview
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Analytics calculated from the content
                optimization results saved with your predictions.
              </p>

            </div>

          </div>

          {!optimization.available ? (

            <div
              style={
                styles.noOptimization
              }
            >

              <div
                style={
                  styles.noOptimizationIcon
                }
              >
                💡
              </div>

              <div>

                <strong>
                  No Optimization Data Yet
                </strong>

                <p>
                  Create a new prediction to generate
                  content optimization analytics.
                </p>

                <button
                  style={
                    styles.primaryButtonSmall
                  }
                  onClick={
                    goToPrediction
                  }
                >
                  Create Prediction
                </button>

              </div>

            </div>

          ) : (

            <>

              <div
                style={
                  styles.optimizationGrid
                }
              >

                <OptimizationCard
                  icon="🎯"
                  title="Average Optimization Score"
                  value={`${Number(
                    optimization.averageScore ||
                      0
                  ).toFixed(1)}/100`}
                  description="Average score across optimized posts"
                />

                <OptimizationCard
                  icon="✨"
                  title="Good Optimization"
                  value={
                    optimization.good
                  }
                  description="Posts scoring 80 or above"
                  valueStyle={
                    styles.goodValue
                  }
                />

                <OptimizationCard
                  icon="⚠️"
                  title="Moderate Optimization"
                  value={
                    optimization.moderate
                  }
                  description="Posts scoring 50–79"
                  valueStyle={
                    styles.moderateValue
                  }
                />

                <OptimizationCard
                  icon="🔧"
                  title="Needs Improvement"
                  value={
                    optimization.needsImprovement
                  }
                  description="Posts scoring below 50"
                  valueStyle={
                    styles.needsImprovementValue
                  }
                />

              </div>

              <div
                style={
                  styles.optimizationQuality
                }
              >

                <div
                  style={
                    styles.qualityHeader
                  }
                >

                  <div>

                    <strong>
                      Overall Optimization Quality
                    </strong>

                    <p>
                      {optimization.status}
                    </p>

                  </div>

                  <span
                    style={{
                      ...styles.qualityBadge,

                      ...(optimization.status ===
                      "Excellent"
                        ? styles.excellentBadge
                        : optimization.status ===
                          "Good"
                        ? styles.goodBadge
                        : optimization.status ===
                          "Moderate"
                        ? styles.moderateBadge
                        : styles.improvementBadge),
                    }}
                  >
                    {optimization.status}
                  </span>

                </div>

                <div
                  style={
                    styles.optimizationProgressBackground
                  }
                >

                  <div
                    style={{
                      ...styles.optimizationProgressBar,

                      width: `${Math.max(
                        0,
                        Math.min(
                          Number(
                            optimization.averageScore ||
                              0
                          ),
                          100
                        )
                      )}%`,
                    }}
                  />

                </div>

                <p
                  style={
                    styles.optimizationCount
                  }
                >
                  {optimization.count} prediction
                  {optimization.count !== 1
                    ? "s"
                    : ""} with optimization analysis
                </p>

              </div>

            </>

          )}

        </section>

        {/* ================================================= */}
        {/* PREDICTION DISTRIBUTION */}
        {/* ================================================= */}

        <section
          style={styles.panel}
        >

          <h2
            style={styles.sectionTitle}
          >
            Engagement Distribution
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            Distribution of your AI engagement predictions.
          </p>

          {statistics.total === 0 ? (

            <EmptyState
              message="No predictions available yet."
            />

          ) : (

            <div
              style={styles.distribution}
            >

              <DistributionRow
                label="High"
                count={statistics.high}
                total={statistics.total}
                percentage={
                  statistics.highPercentage
                }
                type="high"
              />

              <DistributionRow
                label="Medium"
                count={statistics.medium}
                total={statistics.total}
                percentage={
                  statistics.mediumPercentage
                }
                type="medium"
              />

              <DistributionRow
                label="Low"
                count={statistics.low}
                total={statistics.total}
                percentage={
                  statistics.lowPercentage
                }
                type="low"
              />

            </div>

          )}

        </section>

        {/* ================================================= */}
        {/* RECENT PREDICTIONS */}
        {/* ================================================= */}

        <section
          style={styles.panel}
        >

          <div
            style={styles.recentHeader}
          >

            <div>

              <h2
                style={styles.sectionTitle}
              >
                Recent Predictions
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Your latest Instagram engagement analyses.
              </p>

            </div>

            {predictions.length > 0 && (

              <button
                style={styles.textButton}
                onClick={
                  goToHistory
                }
              >
                View All →
              </button>

            )}

          </div>

          {predictions.length === 0 ? (

            <EmptyState
              message="You haven't created any predictions yet."
              actionLabel="Create Your First Prediction"
              onAction={
                goToPrediction
              }
            />

          ) : (

            <div
              style={styles.recentList}
            >

              {predictions
                .slice(0, 5)
                .map(
                  (prediction) => (
                    <RecentPrediction
                      key={
                        prediction.id
                      }
                      prediction={
                        prediction
                      }
                    />
                  )
                )}

            </div>

          )}

        </section>

        {/* ================================================= */}
        {/* AI CONTENT TOOLS */}
        {/* ================================================= */}

        <section>

          <h2
            style={styles.sectionTitle}
          >
            AI Content Tools
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            Manage and analyze your Instagram content.
          </p>

          <div
            style={styles.toolsGrid}
          >

            <ToolCard
              icon="🤖"
              title="Engagement Prediction"
              description="Predict High, Medium or Low engagement."
              buttonText="Make Prediction"
              onClick={
                goToPrediction
              }
            />

            <ToolCard
              icon="🕘"
              title="Prediction History"
              description="Review your previous AI predictions."
              buttonText="View History"
              onClick={
                goToHistory
              }
            />

            <ToolCard
              icon="🖼️"
              title="Image Analysis"
              description="Use your Instagram image as part of the prediction."
              buttonText="Analyze Content"
              onClick={
                goToPrediction
              }
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer
          style={styles.footer}
        >

          <p>
            AI Instagram Engagement Prediction System
          </p>

          <p
            style={
              styles.footerSmall
            }
          >
            Your prediction data is associated with your
            authenticated account.
          </p>

        </footer>

      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  description,
  icon,
  valueStyle,
}) {
  return (
    <div
      style={styles.statCard}
    >

      <div
        style={styles.statTop}
      >

        <span
          style={styles.statIcon}
        >
          {icon}
        </span>

        <span
          style={styles.statTitle}
        >
          {title}
        </span>

      </div>

      <div
        style={{
          ...styles.statValue,
          ...valueStyle,
        }}
      >
        {value}
      </div>

      <div
        style={
          styles.statDescription
        }
      >
        {description}
      </div>

    </div>
  );
}

// ============================================================
// OPTIMIZATION CARD
// ============================================================

function OptimizationCard({
  icon,
  title,
  value,
  description,
  valueStyle,
}) {
  return (
    <div
      style={
        styles.optimizationCard
      }
    >

      <div
        style={
          styles.optimizationCardTop
        }
      >

        <span
          style={
            styles.optimizationCardIcon
          }
        >
          {icon}
        </span>

        <span
          style={
            styles.optimizationCardTitle
          }
        >
          {title}
        </span>

      </div>

      <div
        style={{
          ...styles.optimizationCardValue,
          ...valueStyle,
        }}
      >
        {value}
      </div>

      <p
        style={
          styles.optimizationCardDescription
        }
      >
        {description}
      </p>

    </div>
  );
}

// ============================================================
// DISTRIBUTION ROW
// ============================================================

function DistributionRow({
  label,
  count,
  percentage,
  type,
}) {
  const colors = {
    high: "#16a34a",
    medium: "#f59e0b",
    low: "#dc2626",
  };

  const color =
    colors[type] ||
    "#2563eb";

  const safePercentage =
    Number.isFinite(
      Number(percentage)
    )
      ? Number(percentage)
      : 0;

  return (
    <div
      style={
        styles.distributionRow
      }
    >

      <div
        style={
          styles.distributionInfo
        }
      >

        <div
          style={
            styles.distributionLabel
          }
        >

          <span
            style={{
              ...styles.statusDot,
              background: color,
            }}
          />

          <strong>
            {label}
          </strong>

        </div>

        <span
          style={
            styles.distributionCount
          }
        >
          {count} prediction
          {count !== 1
            ? "s"
            : ""}
        </span>

        <strong>
          {safePercentage.toFixed(1)}%
        </strong>

      </div>

      <div
        style={
          styles.progressBackground
        }
      >

        <div
          style={{
            ...styles.progressBar,
            width: `${Math.max(
              0,
              Math.min(
                safePercentage,
                100
              )
            )}%`,
            background: color,
          }}
        />

      </div>

    </div>
  );
}

// ============================================================
// RECENT PREDICTION
// ============================================================

function RecentPrediction({
  prediction,
}) {
  const result = String(
    prediction.prediction ||
      "Unknown"
  );

  const input =
    prediction.userInput ||
    {};

  const category =
    input.category ||
    prediction.inputSummary
      ?.category ||
    "Unknown";

  const caption =
    input.caption ||
    "No caption";

  const date =
    getPredictionDate(
      prediction
    );

  const imageUploaded =
    prediction.image
      ?.uploaded === true ||
    input.hasImage === true ||
    prediction.inputSummary
      ?.has_image === 1 ||
    prediction.inputSummary
      ?.has_image === true;

  const resultType =
    result.toLowerCase();

  let badgeStyle =
    styles.lowBadge;

  if (
    resultType === "high"
  ) {
    badgeStyle =
      styles.highBadge;
  } else if (
    resultType === "medium"
  ) {
    badgeStyle =
      styles.mediumBadge;
  }

  return (
    <div
      style={styles.recentItem}
    >

      <div
        style={styles.recentMain}
      >

        <div
          style={
            styles.recentTitleRow
          }
        >

          <strong
            style={
              styles.recentCaption
            }
          >
            {truncateText(
              caption,
              70
            )}
          </strong>

          <span
            style={{
              ...styles.resultBadge,
              ...badgeStyle,
            }}
          >
            {result}
          </span>

        </div>

        <div
          style={styles.recentMeta}
        >

          <span>
            {category}
          </span>

          <span>•</span>

          <span>
            {formatDate(date)}
          </span>

          {imageUploaded && (
            <>
              <span>•</span>

              <span>
                🖼️ Image
              </span>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// ============================================================
// TOOL CARD
// ============================================================

function ToolCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div
      style={styles.toolCard}
    >

      <div
        style={styles.toolIcon}
      >
        {icon}
      </div>

      <h3
        style={styles.toolTitle}
      >
        {title}
      </h3>

      <p
        style={
          styles.toolDescription
        }
      >
        {description}
      </p>

      <button
        style={styles.toolButton}
        onClick={onClick}
      >
        {buttonText}
      </button>

    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={styles.emptyState}
    >

      <div
        style={styles.emptyIcon}
      >
        📊
      </div>

      <p>
        {message}
      </p>

      {actionLabel &&
        onAction && (
          <button
            style={
              styles.primaryButton
            }
            onClick={
              onAction
            }
          >
            {actionLabel}
          </button>
        )}

    </div>
  );
}

// ============================================================
// FIRESTORE DATE HELPER
// ============================================================

function getPredictionDate(
  prediction
) {
  const timestamp =
    prediction?.createdAt;

  if (!timestamp) {
    return new Date(0);
  }

  if (
    typeof timestamp.toDate ===
    "function"
  ) {
    return timestamp.toDate();
  }

  if (
    typeof timestamp.seconds ===
    "number"
  ) {
    return new Date(
      timestamp.seconds * 1000
    );
  }

  if (
    timestamp instanceof Date
  ) {
    return timestamp;
  }

  const parsed =
    new Date(timestamp);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed;
  }

  return new Date(0);
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(date) {
  if (
    !date ||
    Number.isNaN(
      date.getTime()
    ) ||
    date.getTime() === 0
  ) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

// ============================================================
// TEXT TRUNCATION
// ============================================================

function truncateText(
  text,
  maxLength
) {
  const value =
    String(text || "");

  if (
    value.length <=
    maxLength
  ) {
    return value;
  }

  return `${value.substring(
    0,
    maxLength
  )}...`;
}

// ============================================================
// STYLES
// ============================================================

const styles = {

  container: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#0f172a",
    padding:
      "40px 20px",
    boxSizing:
      "border-box",
  },

  dashboard: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  // ========================================================
  // HEADER
  // ========================================================

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "25px",
    marginBottom:
      "30px",
  },

  eyebrow: {
    margin:
      "0 0 8px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing:
      "1.5px",
    color: "#60a5fa",
  },

  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "36px",
    lineHeight: "1.2",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#94a3b8",
    fontSize: "16px",
    lineHeight: "1.5",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  // ========================================================
  // BUTTONS
  // ========================================================

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding:
      "13px 20px",
    background:
      "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButtonSmall: {
    border: "none",
    borderRadius: "8px",
    padding:
      "9px 14px",
    marginTop: "10px",
    background:
      "#2563eb",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryButton: {
    border:
      "1px solid #334155",
    borderRadius: "10px",
    padding:
      "12px 18px",
    background:
      "#1e293b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  logoutButton: {
    border:
      "1px solid #7f1d1d",
    borderRadius: "10px",
    padding:
      "12px 18px",
    background:
      "#450a0a",
    color: "#fecaca",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  textButton: {
    border: "none",
    background:
      "transparent",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // ========================================================
  // PROFILE
  // ========================================================

  profileSection: {
    padding:
      "22px",
    marginBottom:
      "25px",
    background:
      "#1e293b",
    border:
      "1px solid #334155",
    borderRadius:
      "16px",
    color:
      "#ffffff",
  },

  profileHeader: {
    display: "flex",
    alignItems:
      "center",
    gap: "15px",
    marginBottom:
      "22px",
  },

  profileHeaderInfo: {
    flex: 1,
  },

  profileAvatar: {
    width: "58px",
    height: "58px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderRadius:
      "50%",
    background:
      "#334155",
    fontSize:
      "27px",
    flexShrink: 0,
  },

  profileEyebrow: {
    margin:
      "0 0 4px",
    color:
      "#60a5fa",
    fontSize:
      "11px",
    fontWeight:
      "800",
    letterSpacing:
      "1.2px",
  },

  profileName: {
    margin: 0,
    color:
      "#ffffff",
    fontSize:
      "22px",
  },

  profileEmail: {
    margin:
      "5px 0 0",
    color:
      "#94a3b8",
    fontSize:
      "13px",
  },

  // ========================================================
  // EDIT PROFILE
  // ========================================================

  editProfileButton: {
    border:
      "1px solid #475569",
    borderRadius:
      "9px",
    padding:
      "10px 16px",
    background:
      "#26344a",
    color:
      "#ffffff",
    fontSize:
      "13px",
    fontWeight:
      "700",
    cursor:
      "pointer",
    whiteSpace:
      "nowrap",
  },

  editProfilePanel: {
    marginBottom:
      "18px",
    padding:
      "22px",
    background:
      "#172033",
    border:
      "1px solid #475569",
    borderRadius:
      "12px",
  },

  editProfileHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap:
      "15px",
    marginBottom:
      "18px",
  },

  editProfileTitle: {
    margin: 0,
    color:
      "#ffffff",
    fontSize:
      "20px",
  },

  editProfileDescription: {
    margin:
      "5px 0 0",
    color:
      "#94a3b8",
    fontSize:
      "13px",
  },

  closeEditButton: {
    width:
      "32px",
    height:
      "32px",
    border:
      "1px solid #475569",
    borderRadius:
      "8px",
    background:
      "#26344a",
    color:
      "#cbd5e1",
    fontSize:
      "22px",
    lineHeight:
      "1",
    cursor:
      "pointer",
  },

  editLabel: {
    display:
      "block",
    marginTop:
      "15px",
    marginBottom:
      "7px",
    color:
      "#cbd5e1",
    fontSize:
      "12px",
    fontWeight:
      "700",
  },

  editInput: {
    width:
      "100%",
    boxSizing:
      "border-box",
    padding:
      "11px 12px",
    border:
      "1px solid #475569",
    borderRadius:
      "8px",
    background:
      "#0f172a",
    color:
      "#ffffff",
    fontSize:
      "14px",
    outline:
      "none",
  },

  editInputHint: {
    margin:
      "6px 0 0",
    color:
      "#64748b",
    fontSize:
      "11px",
  },

  editProfileActions: {
    display:
      "flex",
    justifyContent:
      "flex-end",
    gap:
      "10px",
    marginTop:
      "20px",
  },

  cancelEditButton: {
    border:
      "1px solid #475569",
    borderRadius:
      "8px",
    padding:
      "10px 17px",
    background:
      "transparent",
    color:
      "#cbd5e1",
    fontSize:
      "13px",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  saveProfileButton: {
    border:
      "none",
    borderRadius:
      "8px",
    padding:
      "10px 18px",
    background:
      "#2563eb",
    color:
      "#ffffff",
    fontSize:
      "13px",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  profileMessage: {
    marginTop:
      "15px",
    padding:
      "11px 13px",
    borderRadius:
      "8px",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  profileSuccessMessage: {
    background:
      "#14532d",
    color:
      "#bbf7d0",
    border:
      "1px solid #166534",
  },

  profileErrorMessage: {
    background:
      "#450a0a",
    color:
      "#fecaca",
    border:
      "1px solid #7f1d1d",
  },

  profileDetails: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  profileDetail: {
    display: "flex",
    alignItems:
      "center",
    gap: "12px",
    padding:
      "15px",
    background:
      "#172033",
    border:
      "1px solid #334155",
    borderRadius:
      "12px",
  },

  profileDetailIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderRadius:
      "10px",
    background:
      "#26344a",
    fontSize:
      "18px",
    flexShrink: 0,
  },

  instagramIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderRadius:
      "10px",
    background:
      "#26344a",
    color:
      "#f472b6",
    fontSize:
      "27px",
    fontWeight:
      "800",
    flexShrink: 0,
  },

  profileDetailLabel: {
    display: "block",
    marginBottom:
      "4px",
    color:
      "#94a3b8",
    fontSize:
      "11px",
  },

  profileDetailValue: {
    color:
      "#ffffff",
    fontSize:
      "13px",
  },

  instagramDetailContent: {
    minWidth: 0,
  },

  instagramButton: {
    display: "flex",
    alignItems:
      "center",
    gap: "7px",
    border: "none",
    padding: 0,
    background:
      "transparent",
    color:
      "#60a5fa",
    fontSize:
      "13px",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  accountInformation: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "20px",
    marginTop:
      "15px",
    paddingTop:
      "15px",
    borderTop:
      "1px solid #334155",
  },

  userLabel: {
    display: "block",
    marginBottom:
      "5px",
    color:
      "#94a3b8",
    fontSize:
      "11px",
  },

  userEmail: {
    color:
      "#ffffff",
    fontSize:
      "13px",
  },

  userUidContainer: {
    maxWidth:
      "50%",
    textAlign:
      "right",
  },

  userUid: {
    display:
      "block",
    fontSize:
      "10px",
    color:
      "#cbd5e1",
    wordBreak:
      "break-all",
  },

  // ========================================================
  // ERROR
  // ========================================================

  errorBox: {
    padding:
      "16px 20px",
    marginBottom:
      "25px",
    borderRadius:
      "12px",
    background:
      "#450a0a",
    border:
      "1px solid #7f1d1d",
    color:
      "#fecaca",
  },

  // ========================================================
  // ACTION
  // ========================================================

  actionSection: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "25px",
    padding: "25px",
    marginBottom:
      "30px",
    background:
      "#ffffff",
    borderRadius:
      "16px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.20)",
  },

  // ========================================================
  // SECTIONS
  // ========================================================

  sectionHeader: {
    marginBottom:
      "15px",
  },

  sectionTitle: {
    margin: 0,
    color:
      "#0f172a",
    fontSize:
      "22px",
  },

  sectionDescription: {
    marginTop:
      "6px",
    marginBottom: 0,
    color:
      "#64748b",
    fontSize:
      "14px",
    lineHeight:
      "1.5",
  },

  // ========================================================
  // STATISTICS
  // ========================================================

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "15px",
    marginTop:
      "20px",
    marginBottom:
      "30px",
  },

  statCard: {
    padding: "22px",
    background:
      "#ffffff",
    borderRadius:
      "15px",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.16)",
  },

  statTop: {
    display: "flex",
    alignItems:
      "center",
    gap: "10px",
  },

  statIcon: {
    fontSize: "22px",
  },

  statTitle: {
    color:
      "#64748b",
    fontSize:
      "13px",
    fontWeight:
      "700",
  },

  statValue: {
    marginTop:
      "15px",
    color:
      "#0f172a",
    fontSize:
      "32px",
    fontWeight:
      "800",
  },

  statDescription: {
    marginTop:
      "5px",
    color:
      "#94a3b8",
    fontSize:
      "12px",
  },

  highValue: {
    color:
      "#16a34a",
  },

  mediumValue: {
    color:
      "#d97706",
  },

  lowValue: {
    color:
      "#dc2626",
  },

  // ========================================================
  // OPTIMIZATION
  // ========================================================

  optimizationSection: {
    padding: "25px",
    marginBottom:
      "30px",
    background:
      "#ffffff",
    borderRadius:
      "16px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.18)",
  },

  optimizationHeader: {
    marginBottom:
      "20px",
  },

  optimizationEyebrow: {
    margin:
      "0 0 7px",
    color:
      "#2563eb",
    fontSize:
      "12px",
    fontWeight:
      "800",
    letterSpacing:
      "1.2px",
  },

  optimizationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "15px",
  },

  optimizationCard: {
    padding: "20px",
    background:
      "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius:
      "12px",
  },

  optimizationCardTop: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
  },

  optimizationCardIcon: {
    fontSize: "20px",
  },

  optimizationCardTitle: {
    color:
      "#64748b",
    fontSize:
      "12px",
    fontWeight:
      "700",
    lineHeight:
      "1.3",
  },

  optimizationCardValue: {
    marginTop:
      "14px",
    color:
      "#2563eb",
    fontSize:
      "28px",
    fontWeight:
      "800",
  },

  optimizationCardDescription: {
    margin:
      "5px 0 0",
    color:
      "#94a3b8",
    fontSize:
      "11px",
    lineHeight:
      "1.4",
  },

  goodValue: {
    color:
      "#16a34a",
  },

  moderateValue: {
    color:
      "#d97706",
  },

  needsImprovementValue: {
    color:
      "#dc2626",
  },

  optimizationQuality: {
    marginTop:
      "18px",
    padding:
      "18px",
    background:
      "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius:
      "12px",
  },

  qualityHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "15px",
    marginBottom:
      "14px",
  },

  qualityBadge: {
    padding:
      "7px 12px",
    borderRadius:
      "20px",
    fontSize:
      "12px",
    fontWeight:
      "800",
  },

  excellentBadge: {
    background:
      "#dcfce7",
    color:
      "#166534",
  },

  goodBadge: {
    background:
      "#dbeafe",
    color:
      "#1d4ed8",
  },

  moderateBadge: {
    background:
      "#fef3c7",
    color:
      "#92400e",
  },

  improvementBadge: {
    background:
      "#fee2e2",
    color:
      "#991b1b",
  },

  optimizationProgressBackground: {
    width: "100%",
    height: "11px",
    background:
      "#e2e8f0",
    borderRadius:
      "20px",
    overflow:
      "hidden",
  },

  optimizationProgressBar: {
    height: "100%",
    background:
      "#2563eb",
    borderRadius:
      "20px",
    transition:
      "width 0.5s ease",
  },

  optimizationCount: {
    margin:
      "9px 0 0",
    color:
      "#94a3b8",
    fontSize:
      "12px",
  },

  noOptimization: {
    display: "flex",
    alignItems:
      "center",
    gap: "15px",
    padding:
      "20px",
    background:
      "#f8fafc",
    border:
      "1px dashed #cbd5e1",
    borderRadius:
      "12px",
  },

  noOptimizationIcon: {
    width: "45px",
    height: "45px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#dbeafe",
    borderRadius:
      "50%",
    fontSize:
      "20px",
    flexShrink: 0,
  },

  // ========================================================
  // PANELS
  // ========================================================

  panel: {
    padding: "25px",
    marginBottom:
      "30px",
    background:
      "#ffffff",
    borderRadius:
      "16px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.18)",
  },

  // ========================================================
  // DISTRIBUTION
  // ========================================================

  distribution: {
    marginTop:
      "25px",
  },

  distributionRow: {
    marginBottom:
      "20px",
  },

  distributionInfo: {
    display: "grid",
    gridTemplateColumns:
      "1fr 150px 70px",
    alignItems:
      "center",
    gap: "15px",
    marginBottom:
      "8px",
    color:
      "#334155",
    fontSize:
      "14px",
  },

  distributionLabel: {
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius:
      "50%",
    display:
      "inline-block",
  },

  distributionCount: {
    color:
      "#64748b",
    textAlign:
      "center",
  },

  progressBackground: {
    width: "100%",
    height: "10px",
    background:
      "#e2e8f0",
    borderRadius:
      "20px",
    overflow:
      "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius:
      "20px",
    transition:
      "width 0.4s ease",
  },

  // ========================================================
  // RECENT
  // ========================================================

  recentHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "15px",
  },

  recentList: {
    marginTop:
      "20px",
  },

  recentItem: {
    padding:
      "17px 0",
    borderBottom:
      "1px solid #e2e8f0",
  },

  recentMain: {
    width: "100%",
  },

  recentTitleRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap: "15px",
  },

  recentCaption: {
    color:
      "#0f172a",
    fontSize:
      "14px",
    lineHeight:
      "1.5",
  },

  recentMeta: {
    display:
      "flex",
    flexWrap:
      "wrap",
    gap:
      "8px",
    marginTop:
      "7px",
    color:
      "#64748b",
    fontSize:
      "12px",
  },

  resultBadge: {
    padding:
      "7px 12px",
    borderRadius:
      "20px",
    fontSize:
      "12px",
    fontWeight:
      "800",
    whiteSpace:
      "nowrap",
  },

  highBadge: {
    background:
      "#dcfce7",
    color:
      "#166534",
  },

  mediumBadge: {
    background:
      "#fef3c7",
    color:
      "#92400e",
  },

  lowBadge: {
    background:
      "#fee2e2",
    color:
      "#991b1b",
  },

  // ========================================================
  // TOOLS
  // ========================================================

  toolsGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap:
      "15px",
    marginTop:
      "20px",
  },

  toolCard: {
    padding:
      "25px",
    background:
      "#ffffff",
    borderRadius:
      "15px",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.16)",
  },

  toolIcon: {
    fontSize:
      "32px",
    marginBottom:
      "12px",
  },

  toolTitle: {
    margin: 0,
    color:
      "#0f172a",
    fontSize:
      "17px",
  },

  toolDescription: {
    minHeight:
      "42px",
    marginTop:
      "8px",
    color:
      "#64748b",
    fontSize:
      "13px",
    lineHeight:
      "1.5",
  },

  toolButton: {
    width:
      "100%",
    marginTop:
      "15px",
    padding:
      "10px 15px",
    border:
      "1px solid #cbd5e1",
    borderRadius:
      "8px",
    background:
      "#f8fafc",
    color:
      "#0f172a",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  // ========================================================
  // EMPTY
  // ========================================================

  emptyState: {
    textAlign:
      "center",
    padding:
      "45px 20px",
    color:
      "#64748b",
  },

  emptyIcon: {
    fontSize:
      "35px",
    marginBottom:
      "10px",
  },

  // ========================================================
  // LOADING
  // ========================================================

  loadingCard: {
    width:
      "min(500px, 90%)",
    padding:
      "40px",
    background:
      "#ffffff",
    borderRadius:
      "16px",
    textAlign:
      "center",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.3)",
  },

  spinner: {
    width:
      "38px",
    height:
      "38px",
    margin:
      "0 auto 20px",
    border:
      "4px solid #e2e8f0",
    borderTop:
      "4px solid #2563eb",
    borderRadius:
      "50%",
  },

  loadingTitle: {
    margin: 0,
    color:
      "#0f172a",
  },

  loadingText: {
    color:
      "#64748b",
  },

  // ========================================================
  // FOOTER
  // ========================================================

  footer: {
    marginTop:
      "40px",
    padding:
      "25px",
    textAlign:
      "center",
    color:
      "#94a3b8",
    fontSize:
      "13px",
  },

  footerSmall: {
    marginTop:
      "5px",
    fontSize:
      "11px",
  },
};

export default Dashboard;