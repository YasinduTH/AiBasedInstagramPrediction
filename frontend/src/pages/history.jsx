import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getUserPredictionHistory } from "../services/historyService";

const BACKEND_URL = "http://127.0.0.1:5000";

function History({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD USER HISTORY
  // ============================================================

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

        setError(
          "Unable to load your prediction history. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Unknown date";
    }

    try {
      let date;

      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return "Unknown date";
      }

      return date.toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  // ============================================================
  // FORMAT PERCENTAGE
  // ============================================================

  const formatPercentage = (value) => {
    if (typeof value !== "number") {
      return "0.00%";
    }

    return `${(value * 100).toFixed(2)}%`;
  };

  // ============================================================
  // FORMAT FILE SIZE
  // ============================================================

  const formatFileSize = (bytes) => {
    if (typeof bytes !== "number" || bytes <= 0) {
      return "Unknown";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // ============================================================
  // BUILD IMAGE URL
  // ============================================================

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return null;
    }

    // Already a complete URL
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    // Flask returns something like:
    // /uploads/filename.jpg

    if (imageUrl.startsWith("/")) {
      return `${BACKEND_URL}${imageUrl}`;
    }

    return `${BACKEND_URL}/${imageUrl}`;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          <div>
            <h2>Loading History...</h2>

            <p>
              Please wait while we load your prediction history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Prediction History
            </h1>

            <p style={styles.subtitle}>
              View your previous Instagram engagement predictions.
            </p>
          </div>

          <Link
            to="/dashboard"
            style={styles.dashboardButton}
          >
            ← Dashboard
          </Link>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {!error && history.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📊
            </div>

            <h2>No Predictions Yet</h2>

            <p>
              You haven't made any Instagram engagement
              predictions yet.
            </p>

            <Link
              to="/prediction"
              style={styles.primaryButton}
            >
              Create Your First Prediction
            </Link>
          </div>
        )}

        {/* ======================================================
            HISTORY LIST
        ====================================================== */}

        {history.length > 0 && (
          <div style={styles.list}>

            {/* COUNT */}

            <div style={styles.count}>
              {history.length} prediction
              {history.length !== 1 ? "s" : ""} found
            </div>

            {/* ==================================================
                PREDICTION CARDS
            ================================================== */}

            {history.map((item) => {

              // ==================================================
              // USER INPUT
              // ==================================================

              const input = item.userInput || {};

              // ==================================================
              // API RESPONSE
              //
              // Your new Firestore structure contains:
              //
              // apiResponse
              //   └── image
              //        ├── file_size
              //        ├── file_type
              //        ├── image_height
              //        ├── image_url
              //        ├── image_width
              //        ├── original_file_name
              //        ├── saved_file_name
              //        └── uploaded
              // ==================================================

              const apiResponse =
                item.apiResponse || {};

              const apiImage =
                apiResponse.image || {};

              // ==================================================
              // OTHER POSSIBLE IMAGE STRUCTURES
              //
              // This keeps compatibility with older records.
              // ==================================================

              const imageDetails =
                item.imageDetails || {};

              const oldImage =
                input.image || {};

              const topLevelImage =
                item.image || {};

              // ==================================================
              // IMAGE UPLOADED
              // ==================================================

              const hasImage =
                apiImage.uploaded === true ||
                apiImage.uploaded === 1 ||
                apiImage.has_image === true ||
                apiImage.hasImage === true ||
                topLevelImage.uploaded === true ||
                imageDetails.uploaded === true ||
                input.hasImage === true ||
                input.hasImage === 1 ||
                oldImage.hasImage === true;

              // ==================================================
              // IMAGE URL
              // ==================================================

              const rawImageUrl =
                apiImage.image_url ||
                apiImage.imageUrl ||
                topLevelImage.image_url ||
                topLevelImage.imageUrl ||
                imageDetails.image_url ||
                imageDetails.imageUrl ||
                oldImage.imageUrl ||
                null;

              const imageUrl =
                getImageUrl(rawImageUrl);

              // ==================================================
              // IMAGE FILE NAME
              // ==================================================

              const imageName =
                apiImage.original_file_name ||
                apiImage.originalFileName ||
                input.imageName ||
                imageDetails.fileName ||
                oldImage.fileName ||
                topLevelImage.original_file_name ||
                topLevelImage.fileName ||
                null;

              // ==================================================
              // SAVED FILE NAME
              // ==================================================

              const savedImageName =
                apiImage.saved_file_name ||
                apiImage.savedFileName ||
                null;

              // ==================================================
              // IMAGE TYPE
              // ==================================================

              const imageType =
                apiImage.file_type ||
                apiImage.fileType ||
                input.imageType ||
                imageDetails.fileType ||
                oldImage.fileType ||
                topLevelImage.file_type ||
                topLevelImage.fileType ||
                null;

              // ==================================================
              // IMAGE SIZE
              // ==================================================

              const imageSize =
                apiImage.file_size ??
                apiImage.fileSize ??
                input.imageSize ??
                imageDetails.fileSize ??
                oldImage.fileSize ??
                topLevelImage.file_size ??
                topLevelImage.fileSize ??
                null;

              // ==================================================
              // IMAGE WIDTH
              // ==================================================

              const imageWidth =
                apiImage.image_width ??
                apiImage.imageWidth ??
                input.imageWidth ??
                imageDetails.width ??
                null;

              // ==================================================
              // IMAGE HEIGHT
              // ==================================================

              const imageHeight =
                apiImage.image_height ??
                apiImage.imageHeight ??
                input.imageHeight ??
                imageDetails.height ??
                null;

              // ==================================================
              // PROBABILITIES
              // ==================================================

              const probabilities =
                item.probabilities ||
                apiResponse.probabilities ||
                {};

              // ==================================================
              // PREDICTION
              // ==================================================

              const prediction =
                item.prediction ||
                apiResponse.prediction ||
                "Unknown";

              // ==================================================
              // CONFIDENCE
              // ==================================================

              const confidence =
                typeof item.confidence === "number"
                  ? item.confidence
                  : typeof apiResponse.confidence === "number"
                  ? apiResponse.confidence
                  : null;

              // ==================================================
              // FEATURE COUNT
              // ==================================================

              const featureCount =
                item.featureCount ||
                item.feature_count ||
                apiResponse.feature_count ||
                56;

              // ==================================================
              // INPUT SUMMARY
              // ==================================================

              const inputSummary =
                item.inputSummary ||
                apiResponse.input_summary ||
                {};

              return (
                <div
                  key={item.id}
                  style={styles.card}
                >

                  {/* ==================================================
                      CARD HEADER
                  ================================================== */}

                  <div style={styles.cardHeader}>

                    <div>
                      <h2 style={styles.predictionTitle}>
                        Instagram Prediction
                      </h2>

                      <p style={styles.date}>
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <div
                      style={{
                        ...styles.badge,

                        ...(prediction === "High"
                          ? styles.high
                          : prediction === "Medium"
                          ? styles.medium
                          : styles.low),
                      }}
                    >
                      {prediction}
                    </div>

                  </div>

                  {/* ==================================================
                      USER INPUT
                  ================================================== */}

                  <div style={styles.section}>

                    <h3 style={styles.sectionTitle}>
                      Your Input
                    </h3>

                    <div style={styles.grid}>

                      {/* CAPTION */}

                      <div style={styles.field}>
                        <strong>
                          Caption
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.caption ||
                            "No caption"}
                        </p>
                      </div>

                      {/* HASHTAGS */}

                      <div style={styles.field}>
                        <strong>
                          Hashtags
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.hashtags ||
                            "No hashtags"}
                        </p>
                      </div>

                      {/* CATEGORY */}

                      <div style={styles.field}>
                        <strong>
                          Category
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.category ||
                            inputSummary.category ||
                            "Not specified"}
                        </p>
                      </div>

                      {/* ACCOUNT TYPE */}

                      <div style={styles.field}>
                        <strong>
                          Account Type
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.accountType ||
                            inputSummary.account_type ||
                            "Not specified"}
                        </p>
                      </div>

                      {/* ACTIVITY */}

                      <div style={styles.field}>
                        <strong>
                          Activity Level
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.accountActivityLevel ??
                            inputSummary.account_activity_level ??
                            "Not specified"}
                        </p>
                      </div>

                      {/* CONSISTENCY */}

                      <div style={styles.field}>
                        <strong>
                          Content Consistency
                        </strong>

                        <p style={styles.fieldValue}>
                          {input.contentConsistency ??
                            inputSummary.content_consistency ??
                            "Not specified"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* ==================================================
                      IMAGE SECTION
                  ================================================== */}

                  <div style={styles.imageSection}>

                    <h3 style={styles.sectionTitle}>
                      Image
                    </h3>

                    {/* IMAGE STATUS */}

                    <div
                      style={
                        hasImage
                          ? styles.imageUploaded
                          : styles.imageNotUploaded
                      }
                    >

                      <span style={styles.imageStatusIcon}>
                        {hasImage ? "✓" : "!"}
                      </span>

                      <div>

                        <strong>
                          {hasImage
                            ? "Image Uploaded"
                            : "No Image Uploaded"}
                        </strong>

                        <p style={styles.imageStatusText}>
                          {hasImage
                            ? "The image was received and analyzed by the AI model."
                            : "No image was provided for this prediction."}
                        </p>

                      </div>

                    </div>

                    {/* ==================================================
                        IMAGE PREVIEW
                    ================================================== */}

                    {hasImage && imageUrl && (
                      <div style={styles.previewContainer}>

                        <h4 style={styles.previewTitle}>
                          Uploaded Image
                        </h4>

                        <img
                          src={imageUrl}
                          alt={
                            imageName ||
                            "Instagram uploaded content"
                          }
                          style={styles.previewImage}
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      </div>
                    )}

                    {/* ==================================================
                        IMAGE DETAILS
                    ================================================== */}

                    {hasImage && (
                      <div style={styles.imageDetailsBox}>

                        {/* FILE NAME */}

                        <div style={styles.imageDetail}>
                          <span>
                            File Name
                          </span>

                          <strong>
                            {imageName || "Unknown"}
                          </strong>
                        </div>

                        {/* SAVED FILE */}

                        <div style={styles.imageDetail}>
                          <span>
                            Saved File
                          </span>

                          <strong>
                            {savedImageName ||
                              "Server generated"}
                          </strong>
                        </div>

                        {/* FILE TYPE */}

                        <div style={styles.imageDetail}>
                          <span>
                            File Type
                          </span>

                          <strong>
                            {imageType || "Unknown"}
                          </strong>
                        </div>

                        {/* FILE SIZE */}

                        <div style={styles.imageDetail}>
                          <span>
                            File Size
                          </span>

                          <strong>
                            {formatFileSize(imageSize)}
                          </strong>
                        </div>

                        {/* DIMENSIONS */}

                        <div style={styles.imageDetail}>
                          <span>
                            Dimensions
                          </span>

                          <strong>
                            {imageWidth &&
                            imageHeight
                              ? `${imageWidth} × ${imageHeight}px`
                              : "Unknown"}
                          </strong>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* ==================================================
                      AI RESULT
                  ================================================== */}

                  <div style={styles.resultBox}>

                    <h3 style={styles.sectionTitle}>
                      AI Prediction Result
                    </h3>

                    <div style={styles.resultGrid}>

                      {/* PREDICTION */}

                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>
                          Prediction
                        </span>

                        <strong style={styles.resultValue}>
                          {prediction}
                        </strong>
                      </div>

                      {/* CONFIDENCE */}

                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>
                          Confidence
                        </span>

                        <strong style={styles.resultValue}>
                          {formatPercentage(confidence)}
                        </strong>
                      </div>

                      {/* FEATURES */}

                      <div style={styles.resultItem}>
                        <span style={styles.resultLabel}>
                          Features
                        </span>

                        <strong style={styles.resultValue}>
                          {featureCount}
                        </strong>
                      </div>

                    </div>

                    {/* ==================================================
                        PROBABILITIES
                    ================================================== */}

                    <div style={styles.probabilities}>

                      <h4 style={styles.probabilityTitle}>
                        Prediction Probabilities
                      </h4>

                      {/* HIGH */}

                      <div style={styles.probabilityRow}>
                        <span>
                          High
                        </span>

                        <strong>
                          {formatPercentage(
                            probabilities.High
                          )}
                        </strong>
                      </div>

                      {/* MEDIUM */}

                      <div style={styles.probabilityRow}>
                        <span>
                          Medium
                        </span>

                        <strong>
                          {formatPercentage(
                            probabilities.Medium
                          )}
                        </strong>
                      </div>

                      {/* LOW */}

                      <div style={styles.probabilityRow}>
                        <span>
                          Low
                        </span>

                        <strong>
                          {formatPercentage(
                            probabilities.Low
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "Arial, sans-serif",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  title: {
    color: "#ffffff",
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },

  dashboardButton: {
    textDecoration: "none",
    background: "#1e293b",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    border: "1px solid #334155",
    whiteSpace: "nowrap",
  },

  loading: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
    textAlign: "center",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  empty: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "50px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "15px",
  },

  primaryButton: {
    display: "inline-block",
    marginTop: "20px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  count: {
    color: "#cbd5e1",
    fontSize: "15px",
    textAlign: "center",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "18px",
  },

  predictionTitle: {
    margin: 0,
    color: "#0f172a",
  },

  date: {
    color: "#64748b",
    marginTop: "6px",
    fontSize: "14px",
  },

  badge: {
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "bold",
  },

  high: {
    background: "#dcfce7",
    color: "#166534",
  },

  medium: {
    background: "#fef3c7",
    color: "#92400e",
  },

  low: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  section: {
    marginTop: "25px",
  },

  sectionTitle: {
    color: "#0f172a",
    marginBottom: "15px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },

  field: {
    background: "#f8fafc",
    padding: "15px",
    borderRadius: "10px",
    minWidth: 0,
  },

  fieldValue: {
    color: "#64748b",
    wordBreak: "break-word",
    lineHeight: "1.5",
    marginBottom: 0,
  },

  // ============================================================
  // IMAGE
  // ============================================================

  imageSection: {
    marginTop: "25px",
  },

  imageUploaded: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#dcfce7",
    borderRadius: "10px",
    color: "#166534",
  },

  imageNotUploaded: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#fef2f2",
    borderRadius: "10px",
    color: "#991b1b",
  },

  imageStatusIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.7)",
    fontWeight: "bold",
    fontSize: "18px",
    flexShrink: 0,
  },

  imageStatusText: {
    margin: "5px 0 0 0",
    fontSize: "14px",
    opacity: 0.8,
  },

  // ============================================================
  // IMAGE PREVIEW
  // ============================================================

  previewContainer: {
    marginTop: "15px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
  },

  previewTitle: {
    marginTop: 0,
    marginBottom: "15px",
    color: "#0f172a",
  },

  previewImage: {
    display: "block",
    width: "100%",
    maxWidth: "700px",
    maxHeight: "500px",
    objectFit: "contain",
    margin: "0 auto",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  // ============================================================
  // IMAGE DETAILS
  // ============================================================

  imageDetailsBox: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "10px",
  },

  imageDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "10px",
    minWidth: 0,
  },

  // ============================================================
  // RESULT
  // ============================================================

  resultBox: {
    marginTop: "25px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    textAlign: "center",
  },

  resultItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  resultLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
  },

  resultValue: {
    fontSize: "22px",
    color: "#0f172a",
  },

  probabilities: {
    marginTop: "25px",
  },

  probabilityTitle: {
    color: "#64748b",
    textAlign: "center",
    fontSize: "18px",
    marginBottom: "15px",
  },

  probabilityRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
  },
};

export default History;