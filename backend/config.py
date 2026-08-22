from pathlib import Path


# ============================================================
# PROJECT CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(
    r"D:\newwwwwwww\AiBasedInstagramPrediction"
)

MODEL_DIR = PROJECT_ROOT / "models"

MODEL_PATH = (
    MODEL_DIR /
    "final_instagram_engagement_model.joblib"
)

FEATURE_SCHEMA_PATH = (
    MODEL_DIR /
    "final_model_features.json"
)

METADATA_PATH = (
    MODEL_DIR /
    "final_model_metadata.json"
)

UPLOAD_DIR = (
    PROJECT_ROOT /
    "backend" /
    "uploads"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}

MAX_CONTENT_LENGTH = 10 * 1024 * 1024

API_PREFIX = "/api"