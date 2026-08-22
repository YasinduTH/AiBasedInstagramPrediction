# ============================================================
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
# STAGE 9B - PREDICTION API ROUTES
# ============================================================

from pathlib import Path

import pandas as pd

from flask import (
    Blueprint,
    request,
    jsonify
)

from werkzeug.utils import secure_filename

from config import (
    UPLOAD_DIR,
    ALLOWED_IMAGE_EXTENSIONS
)

from services.feature_engineering import (
    extract_text_features
)

from services.image_processing import (
    extract_image_features
)


prediction_bp = Blueprint(
    "prediction",
    __name__
)


# This is assigned from app.py after the
# PredictionService is initialized.
prediction_service = None


# ============================================================
# IMAGE VALIDATION
# ============================================================

def allowed_image(filename):

    if not filename:
        return False

    extension = Path(
        filename
    ).suffix.lower()

    return extension in (
        ALLOWED_IMAGE_EXTENSIONS
    )


# ============================================================
# HEALTH OF PREDICTION SERVICE
# ============================================================

@prediction_bp.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # ====================================================
        # CHECK SERVICE
        # ====================================================

        if prediction_service is None:

            return jsonify({
                "success": False,
                "error":
                    "Prediction service is not initialized."
            }), 500

        # ====================================================
        # READ USER INPUT
        # ====================================================

        caption = request.form.get(
            "caption",
            ""
        ).strip()

        hashtags = request.form.get(
            "hashtags",
            ""
        ).strip()

        category = request.form.get(
            "category",
            "Travel"
        ).strip()

        account_type = request.form.get(
            "account_type",
            "Creator"
        ).strip()

        # ====================================================
        # NUMERIC INPUT HELPER
        # ====================================================

        def get_float(
            field_name,
            default=0.0
        ):

            value = request.form.get(
                field_name,
                default
            )

            if value is None:
                return float(default)

            value = str(value).strip()

            if value == "":
                return float(default)

            return float(value)

        # ====================================================
        # ACCOUNT FEATURES
        # ====================================================

        follower_count = get_float(
            "follower_count"
        )

        following_count = get_float(
            "following_count"
        )

        account_age_days = get_float(
            "account_age_days"
        )

        verified_status = get_float(
            "verified_status"
        )

        posting_frequency = get_float(
            "posting_frequency"
        )

        average_historical_engagement = (
            get_float(
                "average_historical_engagement"
            )
        )

        audience_growth_rate = get_float(
            "audience_growth_rate"
        )

        account_activity_level = (
            get_float(
                "account_activity_level"
            )
        )

        content_consistency = get_float(
            "content_consistency"
        )

        # ====================================================
        # IMAGE PROCESSING
        # ====================================================

        image = request.files.get(
            "image"
        )

        if image and image.filename:

            if not allowed_image(
                image.filename
            ):

                return jsonify({

                    "success": False,

                    "error":
                        "Unsupported image format. "
                        "Allowed formats: JPG, JPEG, "
                        "PNG and WEBP."

                }), 400

            safe_filename = secure_filename(
                image.filename
            )

            # Prevent collisions
            image_path = (
                UPLOAD_DIR /
                safe_filename
            )

            image.save(
                image_path
            )

            image_features = (
                extract_image_features(
                    image_path
                )
            )

        else:

            image_features = {

                "has_image": 0,

                "image_width": 0,

                "image_height": 0,

                "aspect_ratio": 0.0

            }

        # ====================================================
        # TEXT FEATURE ENGINEERING
        # ====================================================

        text_features = (
            extract_text_features(
                caption,
                hashtags
            )
        )

        # ====================================================
        # CREATE USER FEATURE VALUES
        # ====================================================

        feature_values = {

            # ----------------------------------------------
            # CATEGORICAL
            # ----------------------------------------------

            "category":
                category,

            "account_type":
                account_type,

            # ----------------------------------------------
            # ACCOUNT
            # ----------------------------------------------

            "follower_count":
                follower_count,

            "following_count":
                following_count,

            "account_age_days":
                account_age_days,

            "verified_status":
                verified_status,

            "posting_frequency":
                posting_frequency,

            "average_historical_engagement":
                average_historical_engagement,

            "audience_growth_rate":
                audience_growth_rate,

            "account_activity_level":
                account_activity_level,

            "content_consistency":
                content_consistency

        }

        # ====================================================
        # ADD TEXT FEATURES
        # ====================================================

        feature_values.update(
            text_features
        )

        # ====================================================
        # ADD IMAGE FEATURES
        # ====================================================

        feature_values.update(
            image_features
        )

        # ====================================================
        # BUILD COMPLETE 56-FEATURE VECTOR
        # ====================================================

        complete_features = (
            prediction_service
            .complete_feature_vector(
                feature_values
            )
        )

        dataframe = pd.DataFrame(
            [complete_features]
        )

        # ====================================================
        # FORCE EXACT PRODUCTION ORDER
        # ====================================================

        dataframe = dataframe[
            prediction_service.all_features
        ].copy()

        # ====================================================
        # FINAL PREDICTION
        # ====================================================

        result = prediction_service.predict(
            dataframe
        )

        # ====================================================
        # RETURN RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "prediction": result[
                "prediction"
            ],

            "confidence": result[
                "confidence"
            ],

            "probabilities": result[
                "probabilities"
            ],

            "feature_count":
                dataframe.shape[1],

            "input_summary": {

                "caption_length":
                    len(caption),

                "has_image":
                    image_features[
                        "has_image"
                    ],

                "image_width":
                    image_features[
                        "image_width"
                    ],

                "image_height":
                    image_features[
                        "image_height"
                    ],

                "category":
                    category,

                "account_type":
                    account_type

            }

        })

    # ========================================================
    # VALIDATION ERRORS
    # ========================================================

    except ValueError as error:

        return jsonify({

            "success": False,

            "error": str(error)

        }), 400

    # ========================================================
    # GENERAL ERRORS
    # ========================================================

    except Exception as error:

        return jsonify({

            "success": False,

            "error": str(error)

        }), 500