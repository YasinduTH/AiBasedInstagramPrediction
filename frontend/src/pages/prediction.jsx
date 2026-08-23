import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPrediction } from "../services/predictionService";

function Prediction() {
  const navigate = useNavigate();

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountActivityLevel, setAccountActivityLevel] = useState(0.75);
  const [contentConsistency, setContentConsistency] = useState(0.70);
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setImage(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setImage(null);
      return;
    }

    setError("");
    setImage(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!caption.trim()) {
      setError("Please enter a caption.");
      return;
    }

    if (!category) {
      setError("Please select a content category.");
      return;
    }

    if (!accountType) {
      setError("Please select an account type.");
      return;
    }

    if (!image) {
      setError("Please upload an Instagram post image.");
      return;
    }

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

      setResult(predictionResult);
    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        err?.message ||
          "Prediction failed. Please make sure the AI prediction API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCaption("");
    setHashtags("");
    setCategory("");
    setAccountType("");
    setAccountActivityLevel(0.75);
    setContentConsistency(0.70);
    setImage(null);
    setResult(null);
    setError("");

    const fileInput = document.getElementById("post-image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Instagram Engagement Prediction</h1>

            <p style={styles.subtitle}>
              Analyze your Instagram content using our AI-powered prediction
              model.
            </p>
          </div>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        <div style={styles.layout}>
          {/* Prediction Form */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Create Prediction</h2>

            <p style={styles.cardSubtitle}>
              Enter your Instagram post details below.
            </p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Caption */}
              <div style={styles.field}>
                <label style={styles.label}>Caption *</label>

                <textarea
                  style={styles.textarea}
                  rows="6"
                  placeholder="Example: Amazing sunset in Sri Lanka! 🌅✨ Such a beautiful evening by the beach."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />

                <div style={styles.counter}>
                  {caption.length} characters
                </div>
              </div>

              {/* Hashtags */}
              <div style={styles.field}>
                <label style={styles.label}>Hashtags</label>

                <input
                  style={styles.input}
                  type="text"
                  placeholder="#srilanka #travel #sunset #photography #beach"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                />

                <small style={styles.helpText}>
                  Add hashtags separated by spaces.
                </small>
              </div>

              {/* Category */}
              <div style={styles.field}>
                <label style={styles.label}>Content Category *</label>

                <select
                  style={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Education">Education</option>
                  <option value="Food">Food</option>
                  <option value="Technology">Technology</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Travel">Travel</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Account Type */}
              <div style={styles.field}>
                <label style={styles.label}>Account Type *</label>

                <select
                  style={styles.input}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <option value="">Select account type</option>
                  <option value="Creator">Creator</option>
                  <option value="Business">Business</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              {/* Account Activity */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Account Activity Level
                </label>

                <div style={styles.rangeRow}>
                  <input
                    style={styles.range}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={accountActivityLevel}
                    onChange={(e) =>
                      setAccountActivityLevel(e.target.value)
                    }
                  />

                  <span style={styles.rangeValue}>
                    {Number(accountActivityLevel).toFixed(2)}
                  </span>
                </div>

                <small style={styles.helpText}>
                  Estimate how active the Instagram account is.
                </small>
              </div>

              {/* Content Consistency */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Content Consistency
                </label>

                <div style={styles.rangeRow}>
                  <input
                    style={styles.range}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={contentConsistency}
                    onChange={(e) =>
                      setContentConsistency(e.target.value)
                    }
                  />

                  <span style={styles.rangeValue}>
                    {Number(contentConsistency).toFixed(2)}
                  </span>
                </div>

                <small style={styles.helpText}>
                  Estimate how consistently you publish similar content.
                </small>
              </div>

              {/* Image */}
              <div style={styles.field}>
                <label style={styles.label}>Post Image *</label>

                <div style={styles.uploadBox}>
                  <input
                    id="post-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {image && (
                    <div style={styles.fileName}>
                      Selected: {image.name}
                    </div>
                  )}
                </div>

                <small style={styles.helpText}>
                  Upload the image you plan to publish on Instagram.
                </small>
              </div>

              {/* Buttons */}
              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.predictButton,
                    ...(loading ? styles.disabledButton : {}),
                  }}
                >
                  {loading
                    ? "Analyzing Content..."
                    : "Predict Engagement"}
                </button>

                <button
                  type="button"
                  style={styles.resetButton}
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Result */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Prediction Result</h2>

            <p style={styles.cardSubtitle}>
              Your AI prediction will appear here.
            </p>

            {!result && !loading && (
              <div style={styles.emptyResult}>
                <div style={styles.emptyIcon}>AI</div>

                <h3>No Prediction Yet</h3>

                <p>
                  Complete the form and click{" "}
                  <strong>Predict Engagement</strong>.
                </p>
              </div>
            )}

            {loading && (
              <div style={styles.emptyResult}>
                <div style={styles.spinner}></div>

                <h3>Analyzing Your Content</h3>

                <p>
                  The AI model is analyzing your caption, hashtags and
                  image.
                </p>
              </div>
            )}

            {result && !loading && (
              <PredictionResult result={result} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionResult({ result }) {
  const prediction = result.prediction || "Unknown";

  const probabilities = result.probabilities || {};

  const confidence =
    result.confidence !== undefined
      ? Number(result.confidence)
      : null;

  const getResultStyle = () => {
    if (prediction === "High") {
      return styles.highResult;
    }

    if (prediction === "Medium") {
      return styles.mediumResult;
    }

    if (prediction === "Low") {
      return styles.lowResult;
    }

    return styles.defaultResult;
  };

  return (
    <div>
      <div style={{ ...styles.resultBox, ...getResultStyle() }}>
        <span style={styles.resultLabel}>Predicted Engagement</span>

        <strong style={styles.resultValue}>{prediction}</strong>

        {confidence !== null && (
          <span style={styles.confidence}>
            Confidence: {(confidence * 100).toFixed(2)}%
          </span>
        )}
      </div>

      <div style={styles.probabilitySection}>
        <h3 style={styles.sectionTitle}>Prediction Probabilities</h3>

        {["High", "Medium", "Low"].map((level) => {
          const value = Number(probabilities[level] || 0);

          return (
            <div key={level} style={styles.probabilityRow}>
              <div style={styles.probabilityHeader}>
                <span>{level}</span>

                <span>{(value * 100).toFixed(2)}%</span>
              </div>

              <div style={styles.progressBackground}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${Math.min(value * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {result.feature_count !== undefined && (
        <div style={styles.infoBox}>
          <strong>Model Features Used</strong>

          <span>
            {result.feature_count} production features
          </span>
        </div>
      )}

      {result.input_summary && (
        <div style={styles.summaryBox}>
          <h3 style={styles.sectionTitle}>Input Summary</h3>

          <div style={styles.summaryGrid}>
            {Object.entries(result.input_summary).map(
              ([key, value]) => (
                <div key={key} style={styles.summaryItem}>
                  <span style={styles.summaryKey}>
                    {formatLabel(key)}
                  </span>

                  <span style={styles.summaryValue}>
                    {formatValue(value)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div style={styles.successMessage}>
        ✓ Prediction completed and saved to your history.
      </div>
    </div>
  );
}

function formatLabel(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },

  title: {
    color: "#ffffff",
    margin: "0 0 8px 0",
    fontSize: "32px",
  },

  subtitle: {
    color: "#94a3b8",
    margin: 0,
  },

  backButton: {
    padding: "11px 18px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#ffffff",
    cursor: "pointer",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "25px",
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },

  cardTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
  },

  cardSubtitle: {
    color: "#64748b",
    marginTop: 0,
    marginBottom: "25px",
  },

  field: {
    marginBottom: "20px",
  },

  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#1e293b",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    outline: "none",
  },

  counter: {
    textAlign: "right",
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "12px",
  },

  helpText: {
    display: "block",
    marginTop: "6px",
    color: "#64748b",
    fontSize: "12px",
  },

  rangeRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  range: {
    flex: 1,
  },

  rangeValue: {
    width: "55px",
    textAlign: "center",
    padding: "7px",
    background: "#f1f5f9",
    borderRadius: "6px",
    fontWeight: "600",
  },

  uploadBox: {
    padding: "18px",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
  },

  fileName: {
    marginTop: "10px",
    color: "#475569",
    fontSize: "13px",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "25px",
  },

  predictButton: {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },

  resetButton: {
    padding: "14px 22px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "600",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  error: {
    padding: "12px",
    marginBottom: "20px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },

  emptyResult: {
    minHeight: "350px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#64748b",
  },

  emptyIcon: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "20px",
    marginBottom: "15px",
  },

  spinner: {
    width: "45px",
    height: "45px",
    border: "5px solid #e2e8f0",
    borderTop: "5px solid #2563eb",
    borderRadius: "50%",
    marginBottom: "20px",
    animation: "spin 1s linear infinite",
  },

  resultBox: {
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    marginBottom: "25px",
  },

  highResult: {
    background: "#dcfce7",
    color: "#166534",
  },

  mediumResult: {
    background: "#fef3c7",
    color: "#92400e",
  },

  lowResult: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  defaultResult: {
    background: "#e2e8f0",
    color: "#334155",
  },

  resultLabel: {
    display: "block",
    fontSize: "13px",
    marginBottom: "8px",
  },

  resultValue: {
    display: "block",
    fontSize: "38px",
    marginBottom: "8px",
  },

  confidence: {
    display: "block",
    fontSize: "14px",
  },

  probabilitySection: {
    marginBottom: "25px",
  },

  sectionTitle: {
    fontSize: "17px",
    marginBottom: "15px",
  },

  probabilityRow: {
    marginBottom: "15px",
  },

  probabilityHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "600",
  },

  progressBackground: {
    height: "9px",
    background: "#e2e8f0",
    borderRadius: "20px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
  },

  infoBox: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px",
    background: "#f1f5f9",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  summaryBox: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  summaryItem: {
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "7px",
  },

  summaryKey: {
    display: "block",
    color: "#64748b",
    fontSize: "11px",
    marginBottom: "4px",
  },

  summaryValue: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    wordBreak: "break-word",
  },

  successMessage: {
    marginTop: "20px",
    padding: "12px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "13px",
    textAlign: "center",
  },
};

export default Prediction;