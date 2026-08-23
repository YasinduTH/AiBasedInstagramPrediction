import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { runPrediction } from "../services/predictionService";
import { createReminder } from "../services/reminderService";
import { generatePredictionPDF } from "../services/pdfReportService";

function Prediction() {
  const navigate = useNavigate();

  // ============================================================
  // INPUT STATES
  // ============================================================

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("");
  const [accountType, setAccountType] = useState("");

  const [accountActivityLevel, setAccountActivityLevel] =
    useState(0.75);

  const [contentConsistency, setContentConsistency] =
    useState(0.7);

  const [image, setImage] = useState(null);

  // ============================================================
  // PREDICTION STATES
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ============================================================
  // PDF STATES
  // ============================================================

  const [pdfGenerating, setPdfGenerating] =
    useState(false);

  const [pdfMessage, setPdfMessage] =
    useState("");

  const [pdfError, setPdfError] =
    useState("");

  // ============================================================
  // REMINDER STATES
  // ============================================================

  const [showReminderForm, setShowReminderForm] =
    useState(false);

  const [reminderTitle, setReminderTitle] =
    useState("");

  const [reminderDate, setReminderDate] =
    useState("");

  const [reminderTime, setReminderTime] =
    useState("");

  const [reminderNotes, setReminderNotes] =
    useState("");

  const [reminderSaving, setReminderSaving] =
    useState(false);

  const [reminderMessage, setReminderMessage] =
    useState("");

  const [reminderError, setReminderError] =
    useState("");

  // ============================================================
  // IMAGE UPLOAD
  // ============================================================

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setImage(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      setImage(null);

      return;
    }

    setError("");
    setImage(selectedFile);
  };

  // ============================================================
  // SUBMIT PREDICTION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    setPdfMessage("");
    setPdfError("");

    setReminderMessage("");
    setReminderError("");
    setShowReminderForm(false);

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!caption.trim()) {
      setError(
        "Please enter a caption."
      );
      return;
    }

    if (!category) {
      setError(
        "Please select a content category."
      );
      return;
    }

    if (!accountType) {
      setError(
        "Please select an account type."
      );
      return;
    }

    if (!image) {
      setError(
        "Please upload an Instagram post image."
      );
      return;
    }

    try {
      setLoading(true);

      const predictionResult =
        await runPrediction({
          caption:
            caption.trim(),

          hashtags:
            hashtags.trim(),

          category,

          accountType,

          accountActivityLevel:
            Number(
              accountActivityLevel
            ),

          contentConsistency:
            Number(
              contentConsistency
            ),

          image,
        });

      console.log(
        "Complete prediction response:",
        predictionResult
      );

      setResult(
        predictionResult
      );

      // --------------------------------------------------------
      // DEFAULT REMINDER TITLE
      // --------------------------------------------------------

      const prediction =
        predictionResult?.prediction ||
        predictionResult?.apiResponse
          ?.prediction ||
        "Instagram Post";

      setReminderTitle(
        `Publish ${
          category
        } post - ${
          prediction
        } engagement`
      );

    } catch (err) {
      console.error(
        "Prediction error:",
        err
      );

      setError(
        err?.message ||
          "Prediction failed. Please make sure the AI prediction API is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EXPORT PDF REPORT
  // ============================================================

  const handleExportPDF = async () => {
    if (!result) {
      setPdfError(
        "Prediction data is not available."
      );

      return;
    }

    try {
      setPdfGenerating(true);

      setPdfMessage("");
      setPdfError("");

      // --------------------------------------------------------
      // GENERATE PDF
      // --------------------------------------------------------

      const fileName =
        generatePredictionPDF({
          prediction: result,

          user: null,

          profile: null,
        });

      console.log(
        "PDF generated:",
        fileName
      );

      setPdfMessage(
        "✓ PDF report generated successfully."
      );

    } catch (err) {
      console.error(
        "PDF generation error:",
        err
      );

      setPdfError(
        err?.message ||
          "Unable to generate the PDF report."
      );

    } finally {
      setPdfGenerating(false);
    }
  };

  // ============================================================
  // OPEN REMINDER FORM
  // ============================================================

  const handleOpenReminder = () => {
    setReminderMessage("");
    setReminderError("");

    const prediction =
      result?.prediction ||
      result?.apiResponse?.prediction ||
      "Instagram Post";

    if (!reminderTitle.trim()) {
      setReminderTitle(
        `Publish ${
          category ||
          "Instagram"
        } post - ${
          prediction
        } engagement`
      );
    }

    setShowReminderForm(
      true
    );
  };

  // ============================================================
  // CLOSE REMINDER FORM
  // ============================================================

  const handleCloseReminder = () => {
    if (reminderSaving) {
      return;
    }

    setShowReminderForm(false);

    setReminderError("");
    setReminderMessage("");
  };

  // ============================================================
  // CREATE REMINDER
  // ============================================================

  const handleCreatePredictionReminder =
    async (e) => {
      e.preventDefault();

      setReminderError("");
      setReminderMessage("");

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!reminderTitle.trim()) {
        setReminderError(
          "Please enter a reminder title."
        );

        return;
      }

      if (!reminderDate) {
        setReminderError(
          "Please select a reminder date."
        );

        return;
      }

      if (!reminderTime) {
        setReminderError(
          "Please select a reminder time."
        );

        return;
      }

      if (!result) {
        setReminderError(
          "Prediction data is not available."
        );

        return;
      }

      try {
        setReminderSaving(
          true
        );

        // ------------------------------------------------------
        // EXTRACT PREDICTION
        // ------------------------------------------------------

        const prediction =
          result?.prediction ||
          result?.apiResponse
            ?.prediction ||
          "";

        const confidence =
          getNumber(
            result?.confidence ??
              result?.apiResponse
                ?.confidence
          );

        const optimization =
          result?.optimization ||
          result?.content_optimization ||
          result?.apiResponse
            ?.optimization ||
          result?.apiResponse
            ?.content_optimization ||
          null;

        const optimizationScore =
          getOptimizationScore(
            optimization
          );

        // ------------------------------------------------------
        // IMAGE URL
        // ------------------------------------------------------

        const imageUrl =
          result?.image
            ?.imageUrl ||
          result?.image
            ?.image_url ||
          result?.apiResponse
            ?.image
            ?.image_url ||
          null;

        // ------------------------------------------------------
        // SAVE REMINDER
        // ------------------------------------------------------

        const createdReminder =
          await createReminder({
            title:
              reminderTitle.trim(),

            date:
              reminderDate,

            time:
              reminderTime,

            notes:
              reminderNotes.trim(),

            predictionId:
              result?.id ||
              null,

            caption:
              caption.trim(),

            hashtags:
              hashtags.trim(),

            category,

            prediction,

            confidence,

            optimizationScore,

            imageUrl,
          });

        console.log(
          "Prediction reminder created:",
          createdReminder
        );

        setReminderMessage(
          "✓ Reminder created successfully for this predicted post."
        );

        setTimeout(() => {
          setShowReminderForm(
            false
          );
        }, 1200);

      } catch (err) {
        console.error(
          "Prediction reminder error:",
          err
        );

        setReminderError(
          err?.message ||
            "Unable to create the reminder."
        );

      } finally {
        setReminderSaving(
          false
        );
      }
    };

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {
    setCaption("");
    setHashtags("");
    setCategory("");
    setAccountType("");

    setAccountActivityLevel(
      0.75
    );

    setContentConsistency(
      0.7
    );

    setImage(null);

    setResult(null);
    setError("");

    setPdfGenerating(false);
    setPdfMessage("");
    setPdfError("");

    setShowReminderForm(
      false
    );

    setReminderTitle("");
    setReminderDate("");
    setReminderTime("");
    setReminderNotes("");
    setReminderSaving(false);
    setReminderMessage("");
    setReminderError("");

    const fileInput =
      document.getElementById(
        "post-image"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ============================================================
  // TODAY
  // ============================================================

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={styles.page}>

      <div
        style={styles.container}
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          style={styles.header}
        >

          <div>

            <div
              style={styles.eyebrow}
            >
              AI-POWERED INSTAGRAM ANALYTICS
            </div>

            <h1
              style={styles.title}
            >
              Instagram Engagement Prediction
            </h1>

            <p
              style={styles.subtitle}
            >
              Analyze your Instagram content using our
              AI-powered prediction and optimization system.
            </p>

          </div>

          <button
            type="button"
            style={styles.backButton}
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            ← Dashboard
          </button>

        </div>

        {/* =====================================================
            MAIN LAYOUT
        ====================================================== */}

        <div
          style={styles.layout}
        >

          {/* =================================================
              INPUT FORM
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={styles.cardTitle}
            >
              Create Prediction
            </h2>

            <p
              style={styles.cardSubtitle}
            >
              Enter your Instagram post details below.
            </p>

            {error && (
              <div
                style={styles.error}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* CAPTION */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Caption *
                </label>

                <textarea
                  style={styles.textarea}
                  rows="6"
                  placeholder="Example: Amazing sunset in Sri Lanka! 🌅✨ Such a beautiful evening by the beach."
                  value={caption}
                  onChange={(e) =>
                    setCaption(
                      e.target.value
                    )
                  }
                />

                <div
                  style={styles.counter}
                >
                  {caption.length} characters
                </div>

              </div>

              {/* HASHTAGS */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Hashtags
                </label>

                <input
                  style={styles.input}
                  type="text"
                  placeholder="#srilanka #travel #sunset #photography #beach"
                  value={hashtags}
                  onChange={(e) =>
                    setHashtags(
                      e.target.value
                    )
                  }
                />

                <small
                  style={styles.helpText}
                >
                  Add hashtags separated by spaces.
                </small>

              </div>

              {/* CATEGORY */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Content Category *
                </label>

                <select
                  style={styles.input}
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select category
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Fashion">
                    Fashion
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Food">
                    Food
                  </option>

                  <option value="Technology">
                    Technology
                  </option>

                  <option value="Fitness">
                    Fitness
                  </option>

                  <option value="Travel">
                    Travel
                  </option>

                  <option value="Lifestyle">
                    Lifestyle
                  </option>

                  <option value="Business">
                    Business
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              {/* ACCOUNT TYPE */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Account Type *
                </label>

                <select
                  style={styles.input}
                  value={accountType}
                  onChange={(e) =>
                    setAccountType(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select account type
                  </option>

                  <option value="Creator">
                    Creator
                  </option>

                  <option value="Business">
                    Business
                  </option>

                  <option value="Personal">
                    Personal
                  </option>

                </select>

              </div>

              {/* ACTIVITY */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Account Activity Level
                </label>

                <div
                  style={styles.rangeRow}
                >

                  <input
                    style={styles.range}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      accountActivityLevel
                    }
                    onChange={(e) =>
                      setAccountActivityLevel(
                        e.target.value
                      )
                    }
                  />

                  <span
                    style={
                      styles.rangeValue
                    }
                  >
                    {Number(
                      accountActivityLevel
                    ).toFixed(2)}
                  </span>

                </div>

                <small
                  style={styles.helpText}
                >
                  Estimate how active the Instagram account is.
                </small>

              </div>

              {/* CONSISTENCY */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Content Consistency
                </label>

                <div
                  style={styles.rangeRow}
                >

                  <input
                    style={styles.range}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      contentConsistency
                    }
                    onChange={(e) =>
                      setContentConsistency(
                        e.target.value
                      )
                    }
                  />

                  <span
                    style={
                      styles.rangeValue
                    }
                  >
                    {Number(
                      contentConsistency
                    ).toFixed(2)}
                  </span>

                </div>

                <small
                  style={styles.helpText}
                >
                  Estimate how consistently you publish similar content.
                </small>

              </div>

              {/* IMAGE */}

              <div
                style={styles.field}
              >

                <label
                  style={styles.label}
                >
                  Post Image *
                </label>

                <div
                  style={styles.uploadBox}
                >

                  <input
                    id="post-image"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                  />

                  {image && (
                    <div
                      style={
                        styles.fileName
                      }
                    >
                      Selected:{" "}
                      {image.name}
                    </div>
                  )}

                </div>

                <small
                  style={styles.helpText}
                >
                  The image will be analyzed by the AI system.
                </small>

              </div>

              {/* BUTTONS */}

              <div
                style={styles.buttonRow}
              >

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.predictButton,

                    ...(loading
                      ? styles.disabledButton
                      : {}),
                  }}
                >
                  {loading
                    ? "Analyzing Content..."
                    : "Predict & Optimize"}
                </button>

                <button
                  type="button"
                  style={
                    styles.resetButton
                  }
                  onClick={
                    handleReset
                  }
                  disabled={loading}
                >
                  Reset
                </button>

              </div>

            </form>

          </div>

          {/* =================================================
              RESULTS
          ================================================== */}

          <div
            style={styles.card}
          >

            <h2
              style={styles.cardTitle}
            >
              AI Analysis Result
            </h2>

            <p
              style={styles.cardSubtitle}
            >
              Your prediction and content optimization results.
            </p>

            {!result &&
              !loading && (
                <div
                  style={
                    styles.emptyResult
                  }
                >

                  <div
                    style={
                      styles.emptyIcon
                    }
                  >
                    AI
                  </div>

                  <h3>
                    No Prediction Yet
                  </h3>

                  <p>
                    Complete the form and click{" "}
                    <strong>
                      Predict & Optimize
                    </strong>.
                  </p>

                </div>
              )}

            {loading && (
              <div
                style={
                  styles.emptyResult
                }
              >

                <div
                  style={styles.spinner}
                />

                <h3>
                  Analyzing Your Content
                </h3>

                <p>
                  The AI system is analyzing your
                  caption, hashtags, image and account
                  information.
                </p>

              </div>
            )}

            {result &&
              !loading && (
                <PredictionResult
                  result={result}
                  onScheduleReminder={
                    handleOpenReminder
                  }
                  onExportPDF={
                    handleExportPDF
                  }
                  pdfGenerating={
                    pdfGenerating
                  }
                  pdfMessage={
                    pdfMessage
                  }
                  pdfError={
                    pdfError
                  }
                />
              )}

          </div>

        </div>

      </div>

      {/* =======================================================
          REMINDER MODAL
      ======================================================== */}

      {showReminderForm &&
        result && (
          <div
            style={
              styles.modalOverlay
            }
          >

            <div
              style={styles.modal}
            >

              <div
                style={
                  styles.modalHeader
                }
              >

                <div>

                  <div
                    style={
                      styles.modalEyebrow
                    }
                  >
                    PREDICTED INSTAGRAM POST
                  </div>

                  <h2
                    style={
                      styles.modalTitle
                    }
                  >
                    Schedule This Post
                  </h2>

                  <p
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Create a reminder for this predicted
                    Instagram post.
                  </p>

                </div>

                <button
                  type="button"
                  style={
                    styles.closeButton
                  }
                  onClick={
                    handleCloseReminder
                  }
                  disabled={
                    reminderSaving
                  }
                >
                  ×
                </button>

              </div>

              {/* PREDICTION SUMMARY */}

              <div
                style={
                  styles.reminderPredictionBox
                }
              >

                <div>

                  <span
                    style={
                      styles.reminderSummaryLabel
                    }
                  >
                    Predicted Engagement
                  </span>

                  <strong
                    style={
                      styles.reminderPrediction
                    }
                  >
                    {safeText(
                      result?.prediction ||
                        result?.apiResponse
                          ?.prediction ||
                        "Unknown"
                    )}
                  </strong>

                </div>

                <div>

                  <span
                    style={
                      styles.reminderSummaryLabel
                    }
                  >
                    Confidence
                  </span>

                  <strong>
                    {formatConfidence(
                      result?.confidence ??
                        result?.apiResponse
                          ?.confidence
                    )}
                  </strong>

                </div>

                <div>

                  <span
                    style={
                      styles.reminderSummaryLabel
                    }
                  >
                    Category
                  </span>

                  <strong>
                    {category || "-"}
                  </strong>

                </div>

              </div>

              {reminderMessage && (
                <div
                  style={
                    styles.reminderSuccess
                  }
                >
                  {reminderMessage}
                </div>
              )}

              {reminderError && (
                <div
                  style={
                    styles.reminderError
                  }
                >
                  {reminderError}
                </div>
              )}

              <form
                onSubmit={
                  handleCreatePredictionReminder
                }
              >

                <div
                  style={
                    styles.modalField
                  }
                >

                  <label
                    style={styles.label}
                  >
                    Reminder Title *
                  </label>

                  <input
                    style={styles.input}
                    type="text"
                    value={
                      reminderTitle
                    }
                    onChange={(e) =>
                      setReminderTitle(
                        e.target.value
                      )
                    }
                    placeholder="Example: Publish my travel post"
                    disabled={
                      reminderSaving
                    }
                  />

                </div>

                <div
                  style={
                    styles.reminderDateTimeRow
                  }
                >

                  <div
                    style={
                      styles.modalField
                    }
                  >

                    <label
                      style={
                        styles.label
                      }
                    >
                      Date *
                    </label>

                    <input
                      style={
                        styles.input
                      }
                      type="date"
                      min={today}
                      value={
                        reminderDate
                      }
                      onChange={(e) =>
                        setReminderDate(
                          e.target.value
                        )
                      }
                      disabled={
                        reminderSaving
                      }
                    />

                  </div>

                  <div
                    style={
                      styles.modalField
                    }
                  >

                    <label
                      style={
                        styles.label
                      }
                    >
                      Time *
                    </label>

                    <input
                      style={
                        styles.input
                      }
                      type="time"
                      value={
                        reminderTime
                      }
                      onChange={(e) =>
                        setReminderTime(
                          e.target.value
                        )
                      }
                      disabled={
                        reminderSaving
                      }
                    />

                  </div>

                </div>

                <div
                  style={
                    styles.modalField
                  }
                >

                  <label
                    style={styles.label}
                  >
                    Notes
                  </label>

                  <textarea
                    style={
                      styles.textarea
                    }
                    rows="4"
                    value={
                      reminderNotes
                    }
                    onChange={(e) =>
                      setReminderNotes(
                        e.target.value
                      )
                    }
                    placeholder="Optional notes about this post..."
                    disabled={
                      reminderSaving
                    }
                  />

                </div>

                <div
                  style={
                    styles.linkedPostBox
                  }
                >

                  <div
                    style={
                      styles.linkedPostTitle
                    }
                  >
                    🔗 Prediction Linked
                  </div>

                  <div
                    style={
                      styles.linkedPostText
                    }
                  >
                    This reminder will be linked to
                    the current prediction and saved
                    with the predicted post information.
                  </div>

                </div>

                <div
                  style={
                    styles.modalButtonRow
                  }
                >

                  <button
                    type="button"
                    style={
                      styles.cancelButton
                    }
                    onClick={
                      handleCloseReminder
                    }
                    disabled={
                      reminderSaving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      ...styles.scheduleButton,

                      ...(reminderSaving
                        ? styles.disabledButton
                        : {}),
                    }}
                    disabled={
                      reminderSaving
                    }
                  >
                    {reminderSaving
                      ? "Creating Reminder..."
                      : "🔔 Create Reminder"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}

// ============================================================
// PREDICTION RESULT
// ============================================================

function PredictionResult({
  result,
  onScheduleReminder,
  onExportPDF,
  pdfGenerating,
  pdfMessage,
  pdfError,
}) {
  const prediction =
    safeText(
      result?.prediction ||
        result?.apiResponse
          ?.prediction ||
        "Unknown"
    );

  const probabilities =
    isObject(
      result?.probabilities
    )
      ? result.probabilities
      : isObject(
          result?.apiResponse
            ?.probabilities
        )
      ? result.apiResponse
          .probabilities
      : {};

  const confidence =
    getNumber(
      result?.confidence ??
        result?.apiResponse
          ?.confidence
    );

  const optimization =
    result?.optimization ||
    result?.content_optimization ||
    result?.apiResponse
      ?.optimization ||
    result?.apiResponse
      ?.content_optimization ||
    null;

  return (
    <div>

      {/* =====================================================
          PREDICTION
      ====================================================== */}

      <div
        style={{
          ...styles.resultBox,
          ...getResultStyle(
            prediction
          ),
        }}
      >

        <span
          style={
            styles.resultLabel
          }
        >
          Predicted Engagement
        </span>

        <strong
          style={
            styles.resultValue
          }
        >
          {prediction}
        </strong>

        {confidence !==
          null && (
          <span
            style={
              styles.confidence
            }
          >
            Confidence:{" "}
            {(
              confidence * 100
            ).toFixed(2)}
            %
          </span>
        )}

      </div>

      {/* =====================================================
          PROBABILITIES
      ====================================================== */}

      <div
        style={
          styles.probabilitySection
        }
      >

        <h3
          style={
            styles.sectionTitle
          }
        >
          Prediction Probabilities
        </h3>

        {[
          "High",
          "Medium",
          "Low",
        ].map(
          (level) => {

            const value =
              getNumber(
                probabilities[
                  level
                ]
              ) ?? 0;

            return (
              <div
                key={level}
                style={
                  styles.probabilityRow
                }
              >

                <div
                  style={
                    styles.probabilityHeader
                  }
                >

                  <span>
                    {level}
                  </span>

                  <span>
                    {(
                      value * 100
                    ).toFixed(2)}
                    %
                  </span>

                </div>

                <div
                  style={
                    styles.progressBackground
                  }
                >

                  <div
                    style={{
                      ...styles.progressBar,

                      width: `${Math.min(
                        Math.max(
                          value * 100,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* =====================================================
          ACTION BUTTONS
      ====================================================== */}

      <div
        style={
          styles.resultActions
        }
      >

        <div
          style={
            styles.scheduleSection
          }
        >

          <div>

            <strong
              style={
                styles.scheduleTitle
              }
            >
              Want to publish this post later?
            </strong>

            <p
              style={
                styles.scheduleDescription
              }
            >
              Set a reminder for this predicted
              Instagram post.
            </p>

          </div>

          <button
            type="button"
            style={
              styles.schedulePostButton
            }
            onClick={
              onScheduleReminder
            }
          >
            🔔 Schedule This Post
          </button>

        </div>

        {/* PDF */}

        <div
          style={
            styles.pdfSection
          }
        >

          <div>

            <strong
              style={
                styles.pdfTitle
              }
            >
              Save Your AI Analysis
            </strong>

            <p
              style={
                styles.pdfDescription
              }
            >
              Export the prediction, confidence,
              optimization results and model information
              as a PDF report.
            </p>

          </div>

          <button
            type="button"
            style={{
              ...styles.pdfButton,

              ...(pdfGenerating
                ? styles.disabledButton
                : {}),
            }}
            onClick={
              onExportPDF
            }
            disabled={
              pdfGenerating
            }
          >
            {pdfGenerating
              ? "Generating PDF..."
              : "📄 Export PDF Report"}
          </button>

        </div>

      </div>

      {/* PDF SUCCESS */}

      {pdfMessage && (
        <div
          style={
            styles.pdfSuccess
          }
        >
          {pdfMessage}
        </div>
      )}

      {/* PDF ERROR */}

      {pdfError && (
        <div
          style={
            styles.pdfError
          }
        >
          {pdfError}
        </div>
      )}

      {/* =====================================================
          CONTENT OPTIMIZATION
      ====================================================== */}

      {optimization && (
        <ContentOptimization
          optimization={
            optimization
          }
        />
      )}

      {/* =====================================================
          FEATURE COUNT
      ====================================================== */}

      {(
        result?.feature_count !==
          undefined ||
        result?.apiResponse
          ?.feature_count !==
          undefined
      ) && (

        <div
          style={
            styles.infoBox
          }
        >

          <strong>
            Model Features Used
          </strong>

          <span>
            {safeText(
              result?.feature_count ??
                result?.apiResponse
                  ?.feature_count
            )}{" "}
            production features
          </span>

        </div>
      )}

      {/* =====================================================
          INPUT SUMMARY
      ====================================================== */}

      {isObject(
        result?.input_summary ||
          result?.apiResponse
            ?.input_summary
      ) && (

        <div
          style={
            styles.summaryBox
          }
        >

          <h3
            style={
              styles.sectionTitle
            }
          >
            Input Summary
          </h3>

          <div
            style={
              styles.summaryGrid
            }
          >

            {Object.entries(
              result?.input_summary ||
                result?.apiResponse
                  ?.input_summary ||
                {}
            ).map(
              ([key, value]) => (

                <div
                  key={key}
                  style={
                    styles.summaryItem
                  }
                >

                  <span
                    style={
                      styles.summaryKey
                    }
                  >
                    {formatLabel(
                      key
                    )}
                  </span>

                  <span
                    style={
                      styles.summaryValue
                    }
                  >
                    {formatValue(
                      value
                    )}
                  </span>

                </div>

              )
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      <div
        style={
          styles.successMessage
        }
      >
        ✓ Prediction completed and saved to your history.
      </div>

    </div>
  );
}

// ============================================================
// CONTENT OPTIMIZATION
// ============================================================

function ContentOptimization({
  optimization,
}) {
  if (
    !isObject(
      optimization
    )
  ) {
    return null;
  }

  const score =
    getOptimizationScore(
      optimization
    );

  const caption =
    firstObject(
      optimization.caption,
      optimization.caption_analysis,
      optimization.captionAnalysis
    );

  const hashtagsData =
    firstObject(
      optimization.hashtags,
      optimization.hashtag_analysis,
      optimization.hashtagAnalysis
    );

  const imageData =
    firstObject(
      optimization.image,
      optimization.image_analysis,
      optimization.imageAnalysis
    );

  const accountData =
    firstObject(
      optimization.account,
      optimization.account_analysis,
      optimization.accountAnalysis
    );

  const recommendations =
    firstArray(
      optimization.recommendations,
      optimization.suggestions,
      optimization.recommended_improvements
    );

  const overallRaw =
    optimization.overall_recommendation ??
    optimization.overall ??
    optimization.summary ??
    null;

  const categoryRaw =
    optimization.category_recommendation ??
    optimization.categoryRecommendation ??
    null;

  const overall =
    displayText(
      overallRaw
    );

  const categoryRecommendation =
    displayText(
      categoryRaw
    );

  return (
    <div
      style={
        styles.optimizationContainer
      }
    >

      <div
        style={
          styles.optimizationHeader
        }
      >

        <div>

          <div
            style={
              styles.optimizationEyebrow
            }
          >
            AI CONTENT OPTIMIZATION
          </div>

          <h3
            style={
              styles.optimizationTitle
            }
          >
            Content Optimization
          </h3>

          <p
            style={
              styles.optimizationSubtitle
            }
          >
            Improve your Instagram post before publishing.
          </p>

        </div>

        <div
          style={
            styles.scoreCircle
          }
        >

          <strong
            style={
              styles.scoreCircleStrong
            }
          >
            {score}
          </strong>

          <span>
            /100
          </span>

        </div>

      </div>

      <div
        style={
          styles.scoreSection
        }
      >

        <div
          style={
            styles.scoreHeader
          }
        >

          <span>
            Optimization Score
          </span>

          <strong>
            {score}/100
          </strong>

        </div>

        <div
          style={
            styles.scoreBackground
          }
        >

          <div
            style={{
              ...styles.scoreBar,
              width: `${Math.min(
                Math.max(
                  score,
                  0
                ),
                100
              )}%`,
            }}
          />

        </div>

        <p
          style={
            styles.scoreDescription
          }
        >
          {getScoreDescription(
            score
          )}
        </p>

      </div>

      {optimization.prediction !==
        undefined && (
        <OptimizationSimpleItem
          label="Prediction"
          value={
            optimization.prediction
          }
        />
      )}

      {optimization.confidence !==
        undefined && (
        <OptimizationSimpleItem
          label="Model Confidence"
          value={`${(
            Number(
              optimization.confidence
            ) * 100
          ).toFixed(2)}%`}
        />
      )}

      {optimization.has_image !==
        undefined && (
        <OptimizationSimpleItem
          label="Image Used"
          value={
            optimization.has_image
              ? "✓ Yes"
              : "✗ No"
          }
        />
      )}

      {hasData(caption) && (
        <OptimizationBlock
          title="Caption Analysis"
          icon="✍️"
          data={
            caption
          }
        />
      )}

      {hasData(
        hashtagsData
      ) && (
        <OptimizationBlock
          title="Hashtag Analysis"
          icon="#️⃣"
          data={
            hashtagsData
          }
        />
      )}

      {hasData(
        imageData
      ) && (
        <OptimizationBlock
          title="Image Analysis"
          icon="🖼️"
          data={
            imageData
          }
        />
      )}

      {hasData(
        accountData
      ) && (
        <OptimizationBlock
          title="Account Analysis"
          icon="📊"
          data={
            accountData
          }
        />
      )}

      {overall && (
        <div
          style={
            styles.overallBox
          }
        >

          <div
            style={
              styles.recommendationIcon
            }
          >
            💡
          </div>

          <div>

            <h4
              style={
                styles.recommendationTitle
              }
            >
              Overall Recommendation
            </h4>

            <p
              style={
                styles.recommendationText
              }
            >
              {overall}
            </p>

          </div>

        </div>
      )}

      {recommendations.length >
        0 && (

        <div
          style={
            styles.recommendationsBox
          }
        >

          <h4
            style={
              styles.recommendationsTitle
            }
          >
            Recommended Improvements
          </h4>

          {recommendations.map(
            (
              recommendation,
              index
            ) => (

              <div
                key={index}
                style={
                  styles.recommendationItem
                }
              >

                <span
                  style={
                    styles.checkIcon
                  }
                >
                  ✓
                </span>

                <span>
                  {displayText(
                    recommendation
                  )}
                </span>

              </div>

            )
          )}

        </div>
      )}

      {categoryRecommendation && (
        <div
          style={
            styles.categoryBox
          }
        >

          <div
            style={
              styles.categoryIcon
            }
          >
            🎯
          </div>

          <div>

            <h4
              style={
                styles.recommendationTitle
              }
            >
              Category Recommendation
            </h4>

            <p
              style={
                styles.recommendationText
              }
            >
              {
                categoryRecommendation
              }
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

// ============================================================
// SIMPLE OPTIMIZATION ITEM
// ============================================================

function OptimizationSimpleItem({
  label,
  value,
}) {
  return (
    <div
      style={
        styles.simpleOptimizationItem
      }
    >

      <span
        style={
          styles.simpleOptimizationLabel
        }
      >
        {label}
      </span>

      <span
        style={
          styles.simpleOptimizationValue
        }
      >
        {displayText(
          value
        )}
      </span>

    </div>
  );
}

// ============================================================
// OPTIMIZATION BLOCK
// ============================================================

function OptimizationBlock({
  title,
  icon,
  data,
}) {
  if (
    !isObject(data)
  ) {
    return null;
  }

  const entries =
    Object.entries(
      data
    );

  return (
    <div
      style={
        styles.optimizationBlock
      }
    >

      <h4
        style={
          styles.optimizationBlockTitle
        }
      >

        <span
          style={
            styles.blockIcon
          }
        >
          {icon}
        </span>

        {title}

      </h4>

      <div
        style={
          styles.optimizationItems
        }
      >

        {entries.map(
          ([key, value]) => (

            <div
              key={key}
              style={
                styles.optimizationItem
              }
            >

              <span
                style={
                  styles.optimizationKey
                }
              >
                {formatLabel(
                  key
                )}
              </span>

              <span
                style={
                  styles.optimizationValue
                }
              >
                {formatOptimizationValue(
                  value
                )}
              </span>

            </div>

          )
        )}

      </div>

    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function isObject(value) {
  return (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  );
}

function firstObject(
  ...values
) {
  for (
    const value of values
  ) {
    if (
      isObject(value)
    ) {
      return value;
    }
  }

  return {};
}

function firstArray(
  ...values
) {
  for (
    const value of values
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }
  }

  return [];
}

function getNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isNaN(
    number
  )
    ? null
    : number;
}

function displayText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return String(
      value
    );
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map((item) =>
        displayText(
          item
        )
      )
      .join(", ");
  }

  if (
    isObject(value)
  ) {
    return Object.entries(
      value
    )
      .map(
        ([key, val]) =>
          `${formatLabel(
            key
          )}: ${displayText(
            val
          )}`
      )
      .join(" • ");
  }

  return String(
    value
  );
}

function safeText(
  value
) {
  return displayText(
    value
  );
}

function getOptimizationScore(
  optimization
) {
  if (
    !isObject(
      optimization
    )
  ) {
    return 0;
  }

  const possibleScores = [
    optimization?.optimization_score,
    optimization?.optimizationScore,
    optimization?.score,
  ];

  for (
    const score of
      possibleScores
  ) {
    const number =
      getNumber(score);

    if (
      number !== null
    ) {
      return Math.round(
        number
      );
    }
  }

  return 0;
}

function getScoreDescription(
  score
) {
  if (
    score >= 90
  ) {
    return "Excellent content. Your post is highly optimized.";
  }

  if (
    score >= 75
  ) {
    return "Good content. A few improvements could increase engagement.";
  }

  if (
    score >= 50
  ) {
    return "Moderate optimization. Consider improving the recommended areas.";
  }

  return "Your content has several areas that could be improved before publishing.";
}

function hasData(
  value
) {
  if (!value) {
    return false;
  }

  if (
    isObject(value)
  ) {
    return (
      Object.keys(
        value
      ).length > 0
    );
  }

  return true;
}

function formatOptimizationValue(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "✓ Yes"
      : "✗ No";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map((item) =>
        displayText(
          item
        )
      )
      .join(", ");
  }

  if (
    isObject(value)
  ) {
    return Object.entries(
      value
    )
      .map(
        ([key, val]) =>
          `${formatLabel(
            key
          )}: ${formatOptimizationValue(
            val
          )}`
      )
      .join(" • ");
  }

  return String(
    value
  );
}

function getResultStyle(
  prediction
) {
  if (
    prediction ===
    "High"
  ) {
    return styles.highResult;
  }

  if (
    prediction ===
    "Medium"
  ) {
    return styles.mediumResult;
  }

  if (
    prediction ===
    "Low"
  ) {
    return styles.lowResult;
  }

  return styles.defaultResult;
}

function formatLabel(
  value
) {
  return String(
    value
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatValue(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map((item) =>
        displayText(
          item
        )
      )
      .join(", ");
  }

  if (
    isObject(value)
  ) {
    return displayText(
      value
    );
  }

  return String(
    value
  );
}

function formatConfidence(
  value
) {
  const number =
    getNumber(
      value
    );

  if (
    number === null
  ) {
    return "-";
  }

  return `${(
    number * 100
  ).toFixed(2)}%`;
}

// ============================================================
// STYLES
// ============================================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "40px 20px",
    fontFamily:
      "Arial, sans-serif",
    color: "#0f172a",
  },

  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom:
      "30px",
    gap: "20px",
  },

  eyebrow: {
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing:
      "1.5px",
    marginBottom:
      "8px",
  },

  title: {
    color: "#ffffff",
    margin:
      "0 0 8px 0",
    fontSize: "32px",
  },

  subtitle: {
    color: "#94a3b8",
    margin: 0,
  },

  backButton: {
    padding:
      "11px 18px",
    borderRadius:
      "8px",
    border:
      "1px solid #334155",
    background:
      "#1e293b",
    color:
      "#ffffff",
    cursor:
      "pointer",
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "25px",
    alignItems:
      "start",
  },

  card: {
    background:
      "#ffffff",
    borderRadius:
      "16px",
    padding:
      "30px",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.25)",
  },

  cardTitle: {
    margin:
      "0 0 8px 0",
    fontSize:
      "24px",
  },

  cardSubtitle: {
    color:
      "#64748b",
    marginTop: 0,
    marginBottom:
      "25px",
  },

  field: {
    marginBottom:
      "20px",
  },

  label: {
    display: "block",
    fontWeight:
      "600",
    marginBottom:
      "8px",
    color:
      "#1e293b",
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box",
    padding:
      "12px",
    border:
      "1px solid #cbd5e1",
    borderRadius:
      "8px",
    fontSize:
      "15px",
    outline:
      "none",
  },

  textarea: {
    width: "100%",
    boxSizing:
      "border-box",
    padding:
      "12px",
    border:
      "1px solid #cbd5e1",
    borderRadius:
      "8px",
    fontSize:
      "15px",
    resize:
      "vertical",
    fontFamily:
      "Arial, sans-serif",
    outline:
      "none",
  },

  counter: {
    textAlign:
      "right",
    marginTop:
      "5px",
    color:
      "#94a3b8",
    fontSize:
      "12px",
  },

  helpText: {
    display:
      "block",
    marginTop:
      "6px",
    color:
      "#64748b",
    fontSize:
      "12px",
  },

  rangeRow: {
    display: "flex",
    alignItems:
      "center",
    gap:
      "15px",
  },

  range: {
    flex: 1,
  },

  rangeValue: {
    width:
      "55px",
    textAlign:
      "center",
    padding:
      "7px",
    background:
      "#f1f5f9",
    borderRadius:
      "6px",
    fontWeight:
      "600",
  },

  uploadBox: {
    padding:
      "18px",
    border:
      "2px dashed #cbd5e1",
    borderRadius:
      "10px",
    background:
      "#f8fafc",
  },

  fileName: {
    marginTop:
      "10px",
    color:
      "#475569",
    fontSize:
      "13px",
  },

  buttonRow: {
    display:
      "flex",
    gap:
      "12px",
    marginTop:
      "25px",
  },

  predictButton: {
    flex: 1,
    padding:
      "14px",
    border:
      "none",
    borderRadius:
      "9px",
    background:
      "#2563eb",
    color:
      "#ffffff",
    fontWeight:
      "700",
    fontSize:
      "15px",
    cursor:
      "pointer",
  },

  resetButton: {
    padding:
      "14px 22px",
    border:
      "1px solid #cbd5e1",
    borderRadius:
      "9px",
    background:
      "#ffffff",
    color:
      "#334155",
    fontWeight:
      "600",
    cursor:
      "pointer",
  },

  disabledButton: {
    opacity: 0.6,
    cursor:
      "not-allowed",
  },

  error: {
    padding:
      "12px",
    marginBottom:
      "20px",
    background:
      "#fee2e2",
    color:
      "#b91c1c",
    borderRadius:
      "8px",
    border:
      "1px solid #fecaca",
  },

  emptyResult: {
    minHeight:
      "350px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign:
      "center",
    color:
      "#64748b",
  },

  emptyIcon: {
    width:
      "70px",
    height:
      "70px",
    borderRadius:
      "50%",
    background:
      "#dbeafe",
    color:
      "#2563eb",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight:
      "800",
    fontSize:
      "20px",
    marginBottom:
      "15px",
  },

  spinner: {
    width:
      "45px",
    height:
      "45px",
    border:
      "5px solid #e2e8f0",
    borderTop:
      "5px solid #2563eb",
    borderRadius:
      "50%",
    marginBottom:
      "20px",
  },

  resultBox: {
    padding:
      "25px",
    borderRadius:
      "12px",
    textAlign:
      "center",
    marginBottom:
      "25px",
  },

  highResult: {
    background:
      "#dcfce7",
    color:
      "#166534",
  },

  mediumResult: {
    background:
      "#fef3c7",
    color:
      "#92400e",
  },

  lowResult: {
    background:
      "#fee2e2",
    color:
      "#991b1b",
  },

  defaultResult: {
    background:
      "#e2e8f0",
    color:
      "#334155",
  },

  resultLabel: {
    display:
      "block",
    fontSize:
      "13px",
    marginBottom:
      "8px",
  },

  resultValue: {
    display:
      "block",
    fontSize:
      "38px",
    marginBottom:
      "8px",
  },

  confidence: {
    display:
      "block",
    fontSize:
      "14px",
  },

  probabilitySection: {
    marginBottom:
      "25px",
  },

  sectionTitle: {
    fontSize:
      "17px",
    marginBottom:
      "15px",
  },

  probabilityRow: {
    marginBottom:
      "15px",
  },

  probabilityHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    marginBottom:
      "6px",
    fontSize:
      "14px",
    fontWeight:
      "600",
  },

  progressBackground: {
    height:
      "9px",
    background:
      "#e2e8f0",
    borderRadius:
      "20px",
    overflow:
      "hidden",
  },

  progressBar: {
    height:
      "100%",
    background:
      "#2563eb",
    borderRadius:
      "20px",
  },

  // ========================================================
  // RESULT ACTIONS
  // ========================================================

  resultActions: {
    marginBottom:
      "25px",
  },

  scheduleSection: {
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "15px",
    padding:
      "18px",
    background:
      "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius:
      "10px",
    marginBottom:
      "12px",
  },

  scheduleTitle: {
    display:
      "block",
    fontSize:
      "14px",
    color:
      "#0f172a",
    marginBottom:
      "5px",
  },

  scheduleDescription: {
    margin: 0,
    color:
      "#64748b",
    fontSize:
      "12px",
  },

  schedulePostButton: {
    flexShrink: 0,
    padding:
      "11px 16px",
    border:
      "none",
    borderRadius:
      "8px",
    background:
      "#2563eb",
    color:
      "#ffffff",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  // ========================================================
  // PDF
  // ========================================================

  pdfSection: {
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "15px",
    padding:
      "18px",
    background:
      "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius:
      "10px",
  },

  pdfTitle: {
    display:
      "block",
    fontSize:
      "14px",
    color:
      "#0f172a",
    marginBottom:
      "5px",
  },

  pdfDescription: {
    margin: 0,
    color:
      "#64748b",
    fontSize:
      "12px",
    lineHeight:
      "1.5",
  },

  pdfButton: {
    flexShrink: 0,
    padding:
      "11px 16px",
    border:
      "none",
    borderRadius:
      "8px",
    background:
      "#0f172a",
    color:
      "#ffffff",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },

  pdfSuccess: {
    padding:
      "11px 14px",
    marginBottom:
      "18px",
    background:
      "#dcfce7",
    color:
      "#166534",
    borderRadius:
      "8px",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  pdfError: {
    padding:
      "11px 14px",
    marginBottom:
      "18px",
    background:
      "#fee2e2",
    color:
      "#b91c1c",
    borderRadius:
      "8px",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  infoBox: {
    display:
      "flex",
    justifyContent:
      "space-between",
    padding:
      "14px",
    background:
      "#f1f5f9",
    borderRadius:
      "8px",
    marginBottom:
      "20px",
    fontSize:
      "14px",
  },

  summaryBox: {
    borderTop:
      "1px solid #e2e8f0",
    paddingTop:
      "20px",
  },

  summaryGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap:
      "10px",
  },

  summaryItem: {
    padding:
      "10px",
    background:
      "#f8fafc",
    borderRadius:
      "7px",
  },

  summaryKey: {
    display:
      "block",
    color:
      "#64748b",
    fontSize:
      "11px",
    marginBottom:
      "4px",
  },

  summaryValue: {
    display:
      "block",
    fontSize:
      "13px",
    fontWeight:
      "600",
    wordBreak:
      "break-word",
  },

  successMessage: {
    marginTop:
      "20px",
    padding:
      "12px",
    borderRadius:
      "8px",
    background:
      "#dcfce7",
    color:
      "#166534",
    fontSize:
      "13px",
    textAlign:
      "center",
  },

  // ========================================================
  // OPTIMIZATION
  // ========================================================

  optimizationContainer: {
    marginTop:
      "30px",
    borderTop:
      "2px solid #e2e8f0",
    paddingTop:
      "25px",
  },

  optimizationHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      "15px",
    marginBottom:
      "20px",
  },

  optimizationEyebrow: {
    color:
      "#2563eb",
    fontSize:
      "11px",
    fontWeight:
      "800",
    letterSpacing:
      "1.2px",
    marginBottom:
      "5px",
  },

  optimizationTitle: {
    margin: 0,
    fontSize:
      "21px",
    color:
      "#0f172a",
  },

  optimizationSubtitle: {
    margin:
      "5px 0 0 0",
    color:
      "#64748b",
    fontSize:
      "13px",
  },

  scoreCircle: {
    width:
      "75px",
    height:
      "75px",
    minWidth:
      "75px",
    borderRadius:
      "50%",
    background:
      "#eff6ff",
    border:
      "5px solid #2563eb",
    display:
      "flex",
    flexDirection:
      "column",
    justifyContent:
      "center",
    alignItems:
      "center",
    color:
      "#2563eb",
  },

  scoreCircleStrong: {
    fontSize:
      "20px",
  },

  scoreSection: {
    padding:
      "17px",
    background:
      "#f8fafc",
    borderRadius:
      "10px",
    marginBottom:
      "20px",
  },

  scoreHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    marginBottom:
      "9px",
    fontSize:
      "14px",
  },

  scoreBackground: {
    height:
      "10px",
    background:
      "#e2e8f0",
    borderRadius:
      "20px",
    overflow:
      "hidden",
  },

  scoreBar: {
    height:
      "100%",
    background:
      "#2563eb",
    borderRadius:
      "20px",
    transition:
      "width 0.5s ease",
  },

  scoreDescription: {
    margin:
      "10px 0 0 0",
    color:
      "#64748b",
    fontSize:
      "12px",
  },

  simpleOptimizationItem: {
    display:
      "flex",
    justifyContent:
      "space-between",
    gap:
      "15px",
    padding:
      "12px 14px",
    marginBottom:
      "8px",
    background:
      "#f8fafc",
    borderRadius:
      "8px",
    fontSize:
      "13px",
  },

  simpleOptimizationLabel: {
    color:
      "#64748b",
  },

  simpleOptimizationValue: {
    color:
      "#0f172a",
    fontWeight:
      "700",
    textAlign:
      "right",
  },

  optimizationBlock: {
    border:
      "1px solid #e2e8f0",
    borderRadius:
      "10px",
    marginBottom:
      "15px",
    overflow:
      "hidden",
  },

  optimizationBlockTitle: {
    margin: 0,
    padding:
      "13px 15px",
    background:
      "#f8fafc",
    fontSize:
      "14px",
    color:
      "#0f172a",
  },

  blockIcon: {
    marginRight:
      "8px",
  },

  optimizationItems: {
    padding:
      "5px 15px 10px",
  },

  optimizationItem: {
    display:
      "flex",
    justifyContent:
      "space-between",
    gap:
      "15px",
    padding:
      "9px 0",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize:
      "12px",
  },

  optimizationKey: {
    color:
      "#64748b",
  },

  optimizationValue: {
    color:
      "#0f172a",
    fontWeight:
      "600",
    textAlign:
      "right",
    maxWidth:
      "60%",
    wordBreak:
      "break-word",
  },

  overallBox: {
    display:
      "flex",
    gap:
      "12px",
    padding:
      "16px",
    background:
      "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius:
      "10px",
    marginBottom:
      "15px",
  },

  recommendationIcon: {
    fontSize:
      "22px",
  },

  recommendationTitle: {
    margin:
      "0 0 5px 0",
    fontSize:
      "14px",
    color:
      "#0f172a",
  },

  recommendationText: {
    margin: 0,
    color:
      "#475569",
    fontSize:
      "13px",
    lineHeight:
      1.5,
  },

  recommendationsBox: {
    padding:
      "16px",
    background:
      "#f8fafc",
    borderRadius:
      "10px",
    marginBottom:
      "15px",
  },

  recommendationsTitle: {
    margin:
      "0 0 12px 0",
    fontSize:
      "14px",
  },

  recommendationItem: {
    display:
      "flex",
    gap:
      "9px",
    padding:
      "8px 0",
    fontSize:
      "13px",
    color:
      "#475569",
    lineHeight:
      1.4,
  },

  checkIcon: {
    color:
      "#16a34a",
    fontWeight:
      "700",
  },

  categoryBox: {
    display:
      "flex",
    gap:
      "12px",
    padding:
      "16px",
    background:
      "#f0fdf4",
    border:
      "1px solid #bbf7d0",
    borderRadius:
      "10px",
  },

  categoryIcon: {
    fontSize:
      "22px",
  },

  // ========================================================
  // REMINDER MODAL
  // ========================================================

  modalOverlay: {
    position:
      "fixed",
    inset: 0,
    background:
      "rgba(15, 23, 42, 0.72)",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    padding:
      "20px",
    zIndex:
      9999,
    overflowY:
      "auto",
  },

  modal: {
    width:
      "100%",
    maxWidth:
      "650px",
    maxHeight:
      "90vh",
    overflowY:
      "auto",
    background:
      "#ffffff",
    borderRadius:
      "16px",
    padding:
      "30px",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.4)",
  },

  modalHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    gap:
      "20px",
    marginBottom:
      "20px",
  },

  modalEyebrow: {
    color:
      "#2563eb",
    fontSize:
      "11px",
    fontWeight:
      "800",
    letterSpacing:
      "1.2px",
    marginBottom:
      "6px",
  },

  modalTitle: {
    margin: 0,
    fontSize:
      "25px",
    color:
      "#0f172a",
  },

  modalSubtitle: {
    margin:
      "6px 0 0 0",
    color:
      "#64748b",
    fontSize:
      "13px",
  },

  closeButton: {
    width:
      "35px",
    height:
      "35px",
    borderRadius:
      "50%",
    border:
      "none",
    background:
      "#f1f5f9",
    color:
      "#334155",
    fontSize:
      "24px",
    cursor:
      "pointer",
    flexShrink:
      0,
  },

  reminderPredictionBox: {
    display:
      "grid",
    gridTemplateColumns:
      "1.4fr 1fr 1fr",
    gap:
      "10px",
    padding:
      "15px",
    marginBottom:
      "20px",
    background:
      "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius:
      "10px",
  },

  reminderSummaryLabel: {
    display:
      "block",
    color:
      "#64748b",
    fontSize:
      "11px",
    marginBottom:
      "5px",
  },

  reminderPrediction: {
    color:
      "#2563eb",
    fontSize:
      "18px",
  },

  reminderSuccess: {
    padding:
      "12px",
    marginBottom:
      "18px",
    borderRadius:
      "8px",
    background:
      "#dcfce7",
    color:
      "#166534",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  reminderError: {
    padding:
      "12px",
    marginBottom:
      "18px",
    borderRadius:
      "8px",
    background:
      "#fee2e2",
    color:
      "#b91c1c",
    fontSize:
      "13px",
    fontWeight:
      "600",
  },

  modalField: {
    marginBottom:
      "18px",
  },

  reminderDateTimeRow: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap:
      "15px",
  },

  linkedPostBox: {
    padding:
      "14px",
    marginBottom:
      "20px",
    background:
      "#eff6ff",
    border:
      "1px solid #bfdbfe",
    borderRadius:
      "9px",
  },

  linkedPostTitle: {
    fontWeight:
      "700",
    color:
      "#1d4ed8",
    fontSize:
      "13px",
    marginBottom:
      "5px",
  },

  linkedPostText: {
    color:
      "#475569",
    fontSize:
      "12px",
    lineHeight:
      1.5,
  },

  modalButtonRow: {
    display:
      "flex",
    justifyContent:
      "flex-end",
    gap:
      "10px",
    marginTop:
      "10px",
  },

  cancelButton: {
    padding:
      "12px 20px",
    border:
      "1px solid #cbd5e1",
    borderRadius:
      "8px",
    background:
      "#ffffff",
    color:
      "#334155",
    fontWeight:
      "600",
    cursor:
      "pointer",
  },

  scheduleButton: {
    padding:
      "12px 20px",
    border:
      "none",
    borderRadius:
      "8px",
    background:
      "#2563eb",
    color:
      "#ffffff",
    fontWeight:
      "700",
    cursor:
      "pointer",
  },
};

export default Prediction;