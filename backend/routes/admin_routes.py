# ============================================================
# ADMIN ROUTES
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
#
# Features:
# - Firebase ID token verification
# - Administrator claim verification
# - User listing
# - Administrator detection
# - Dashboard statistics
# - Single user details
# - Safe user deletion
# ============================================================

from functools import wraps

from flask import (
    Blueprint,
    jsonify,
    request,
)

from firebase_admin import (
    auth,
)

from services.admin_service import (
    get_all_users,
    get_user_details,
    delete_user,
)


# ============================================================
# BLUEPRINT
# ============================================================

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin",
)


# ============================================================
# VERIFY ADMIN
# ============================================================

def admin_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        # ====================================================
        # GET AUTHORIZATION HEADER
        # ====================================================

        authorization = request.headers.get(
            "Authorization",
            ""
        )

        if not authorization.startswith(
            "Bearer "
        ):

            return jsonify({

                "success": False,

                "error": (
                    "Authentication token "
                    "is required."
                ),

            }), 401


        # ====================================================
        # EXTRACT FIREBASE ID TOKEN
        # ====================================================

        id_token = authorization[
            7:
        ].strip()


        if not id_token:

            return jsonify({

                "success": False,

                "error": (
                    "Invalid authentication token."
                ),

            }), 401


        # ====================================================
        # VERIFY FIREBASE ID TOKEN
        # ====================================================

        try:

            decoded_token = (
                auth.verify_id_token(
                    id_token
                )
            )

        except Exception as error:

            print(
                "Admin authentication error:",
                error
            )

            return jsonify({

                "success": False,

                "error": (
                    "Invalid or expired "
                    "authentication token."
                ),

            }), 401


        # ====================================================
        # CHECK ADMIN CUSTOM CLAIM
        # ====================================================

        is_admin = bool(
            decoded_token.get(
                "admin",
                False
            )
        )


        # ----------------------------------------------------
        # OPTIONAL SUPPORT FOR isAdmin CLAIM
        # ----------------------------------------------------

        if not is_admin:

            is_admin = bool(
                decoded_token.get(
                    "isAdmin",
                    False
                )
            )


        if not is_admin:

            return jsonify({

                "success": False,

                "error": (
                    "Administrator access "
                    "is required."
                ),

            }), 403


        # ====================================================
        # PASS VERIFIED USER INFORMATION
        # ====================================================

        return function(
            decoded_token,
            *args,
            **kwargs
        )


    return wrapper


# ============================================================
# HELPER
# GET FIREBASE ADMIN STATUS
# ============================================================

def get_firebase_admin_status(uid):

    """
    Read the administrator custom claim directly
    from Firebase Authentication.

    This is intentionally checked from Firebase Auth
    rather than relying only on the Firestore profile.
    """

    try:

        firebase_user = (
            auth.get_user(uid)
        )


        claims = (
            firebase_user.custom_claims
            or {}
        )


        is_admin = bool(
            claims.get(
                "admin",
                False
            )
        )


        # ----------------------------------------------------
        # Also support isAdmin if it exists
        # ----------------------------------------------------

        if not is_admin:

            is_admin = bool(
                claims.get(
                    "isAdmin",
                    False
                )
            )


        return is_admin


    except auth.UserNotFoundError:

        return False


    except Exception as error:

        print(
            f"Failed to read admin claim "
            f"for {uid}:",
            error
        )

        return False


# ============================================================
# ENRICH USERS WITH ADMIN STATUS
# ============================================================

def enrich_users_with_admin_status(
    users
):

    """
    Add Firebase administrator information
    to every user returned by admin_service.
    """

    enriched_users = []


    for user in users:

        # ----------------------------------------------------
        # Get UID
        # ----------------------------------------------------

        uid = (
            user.get("uid")
            or
            user.get("userId")
            or
            user.get("id")
        )


        # ----------------------------------------------------
        # Default admin status
        # ----------------------------------------------------

        is_admin = False


        # ----------------------------------------------------
        # Read Firebase custom claim
        # ----------------------------------------------------

        if uid:

            is_admin = (
                get_firebase_admin_status(
                    uid
                )
            )


        # ----------------------------------------------------
        # Copy existing user data
        # ----------------------------------------------------

        user_data = dict(
            user
        )


        # ----------------------------------------------------
        # Add administrator information
        # ----------------------------------------------------

        user_data["admin"] = (
            is_admin
        )

        user_data["isAdmin"] = (
            is_admin
        )


        # ----------------------------------------------------
        # Ensure statistics fields exist
        # ----------------------------------------------------

        if "predictionCount" not in user_data:

            user_data["predictionCount"] = (
                user_data.get(
                    "predictions",
                    0
                )
                if isinstance(
                    user_data.get(
                        "predictions"
                    ),
                    int
                )
                else 0
            )


        if "reminderCount" not in user_data:

            user_data["reminderCount"] = (
                user_data.get(
                    "reminders",
                    0
                )
                if isinstance(
                    user_data.get(
                        "reminders"
                    ),
                    int
                )
                else 0
            )


        enriched_users.append(
            user_data
        )


    return enriched_users


# ============================================================
# ADMIN HEALTH CHECK
# ============================================================

@admin_bp.route(
    "/health",
    methods=["GET"]
)
@admin_required
def admin_health(
    decoded_token
):

    return jsonify({

        "success": True,

        "message": (
            "Admin authentication "
            "is working."
        ),

        "adminUid": (
            decoded_token.get(
                "uid"
            )
        ),

        "admin": True,

    }), 200


# ============================================================
# GET ALL USERS
# ============================================================

@admin_bp.route(
    "/users",
    methods=["GET"]
)
@admin_required
def admin_users(
    decoded_token
):

    try:

        # ====================================================
        # GET USERS FROM ADMIN SERVICE
        # ====================================================

        users = get_all_users()


        # ====================================================
        # ADD FIREBASE ADMIN STATUS
        # ====================================================

        users = (
            enrich_users_with_admin_status(
                users
            )
        )


        # ====================================================
        # CALCULATE TOTAL USERS
        # ====================================================

        total_users = len(
            users
        )


        # ====================================================
        # CALCULATE TOTAL PREDICTIONS
        # ====================================================

        total_predictions = 0


        for user in users:

            prediction_count = (
                user.get(
                    "predictionCount",
                    0
                )
            )


            try:

                total_predictions += int(
                    prediction_count
                )

            except (
                TypeError,
                ValueError
            ):

                pass


        # ====================================================
        # CALCULATE TOTAL REMINDERS
        # ====================================================

        total_reminders = 0


        for user in users:

            reminder_count = (
                user.get(
                    "reminderCount",
                    0
                )
            )


            try:

                total_reminders += int(
                    reminder_count
                )

            except (
                TypeError,
                ValueError
            ):

                pass


        # ====================================================
        # CALCULATE ADMINISTRATORS
        # ====================================================

        total_administrators = sum(

            1

            for user
            in users

            if user.get(
                "admin",
                False
            ) is True

        )


        # ====================================================
        # LOG ADMIN STATISTICS
        # ====================================================

        print(
            "\nADMIN DASHBOARD STATISTICS"
        )

        print(
            f"Total users: "
            f"{total_users}"
        )

        print(
            f"Total predictions: "
            f"{total_predictions}"
        )

        print(
            f"Total reminders: "
            f"{total_reminders}"
        )

        print(
            f"Total administrators: "
            f"{total_administrators}"
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "count": total_users,

            "users": users,

            "statistics": {

                "totalUsers":
                    total_users,

                "totalPredictions":
                    total_predictions,

                "totalReminders":
                    total_reminders,

                "totalAdministrators":
                    total_administrators,

            },

        }), 200


    except Exception as error:

        print(
            "Admin users error:",
            error
        )


        return jsonify({

            "success": False,

            "error": (
                "Failed to load users."
            ),

        }), 500


# ============================================================
# GET SINGLE USER
# ============================================================

@admin_bp.route(
    "/users/<uid>",
    methods=["GET"]
)
@admin_required
def admin_user_details(
    decoded_token,
    uid
):

    try:

        # ====================================================
        # GET USER PROFILE
        # ====================================================

        user = get_user_details(
            uid
        )


        # ====================================================
        # GET FIREBASE ADMIN STATUS
        # ====================================================

        is_admin = (
            get_firebase_admin_status(
                uid
            )
        )


        # ====================================================
        # ADD ADMIN INFORMATION
        # ====================================================

        user["admin"] = (
            is_admin
        )

        user["isAdmin"] = (
            is_admin
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "user": user,

        }), 200


    except auth.UserNotFoundError:

        return jsonify({

            "success": False,

            "error": (
                "User not found."
            ),

        }), 404


    except Exception as error:

        print(
            "Admin user details error:",
            error
        )


        return jsonify({

            "success": False,

            "error": (
                "Failed to load user."
            ),

        }), 500


# ============================================================
# DELETE USER
# ============================================================

@admin_bp.route(
    "/users/<uid>",
    methods=["DELETE"]
)
@admin_required
def admin_delete_user(
    decoded_token,
    uid
):

    # ========================================================
    # PREVENT ADMIN FROM DELETING THEMSELVES
    # ========================================================

    current_admin_uid = (
        decoded_token.get(
            "uid"
        )
    )


    if uid == current_admin_uid:

        return jsonify({

            "success": False,

            "error": (
                "You cannot delete "
                "your own administrator account."
            ),

        }), 400


    # ========================================================
    # CHECK TARGET USER
    # ========================================================

    try:

        target_user = (
            auth.get_user(uid)
        )


    except auth.UserNotFoundError:

        return jsonify({

            "success": False,

            "error": (
                "User not found."
            ),

        }), 404


    # ========================================================
    # PROTECT OTHER ADMINISTRATORS
    # ========================================================

    target_claims = (
        target_user.custom_claims
        or {}
    )


    target_is_admin = bool(
        target_claims.get(
            "admin",
            False
        )
    )


    if not target_is_admin:

        target_is_admin = bool(
            target_claims.get(
                "isAdmin",
                False
            )
        )


    if target_is_admin:

        return jsonify({

            "success": False,

            "error": (
                "Administrator accounts "
                "cannot be deleted from "
                "the user management panel."
            ),

        }), 400


    # ========================================================
    # DELETE USER
    # ========================================================

    try:

        delete_user(
            uid
        )


        return jsonify({

            "success": True,

            "message": (
                "User deleted successfully."
            ),

            "deletedUserId":
                uid,

        }), 200


    except auth.UserNotFoundError:

        return jsonify({

            "success": False,

            "error": (
                "User not found."
            ),

        }), 404


    except Exception as error:

        print(
            "Admin delete user error:",
            error
        )


        return jsonify({

            "success": False,

            "error": (
                "Failed to delete user."
            ),

        }), 500