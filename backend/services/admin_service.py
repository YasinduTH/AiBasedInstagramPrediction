# ============================================================
# ADMIN SERVICE
# AI-BASED INSTAGRAM ENGAGEMENT PREDICTION SYSTEM
#
# Firestore "users" collection is the SOURCE OF TRUTH
# for the Admin Dashboard.
# ============================================================

from firebase_admin import (
    auth,
    firestore,
)

from firebase_admin.exceptions import (
    FirebaseError,
)


# ============================================================
# FIRESTORE
# ============================================================

db = firestore.client()


# ============================================================
# HELPER - CONVERT FIRESTORE VALUES TO JSON-SAFE VALUES
# ============================================================

def serialize_value(value):
    """
    Convert Firestore values such as timestamps into
    JSON-safe values.
    """

    if value is None:
        return None

    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass

    return value


# ============================================================
# HELPER - GET PROFILE DATA
# ============================================================

def get_profile(uid):
    """
    Get a user's Firestore profile.

    Firestore collection:

        users/{uid}
    """

    if not uid:
        return {}

    profile_ref = (
        db.collection("users")
        .document(uid)
    )

    snapshot = profile_ref.get()

    if not snapshot.exists:
        return {}

    return snapshot.to_dict() or {}


# ============================================================
# HELPER - GET AUTH USER
# ============================================================

def get_auth_user(uid):
    """
    Get Firebase Authentication user.

    Returns None if the Auth account does not exist.
    """

    if not uid:
        return None

    try:
        return auth.get_user(uid)

    except auth.UserNotFoundError:
        return None

    except Exception as error:
        print(
            f"Failed to get Auth user {uid}:",
            error
        )

        return None


# ============================================================
# HELPER - GET PREDICTION COUNT
# ============================================================

def get_prediction_count(uid):
    """
    Count predictions belonging to the user.
    """

    if not uid:
        return 0

    try:

        snapshots = (
            db.collection("predictions")
            .where(
                "userId",
                "==",
                uid
            )
            .stream()
        )

        return sum(
            1 for _ in snapshots
        )

    except Exception as error:

        print(
            f"Prediction count error for {uid}:",
            error
        )

        return 0


# ============================================================
# HELPER - GET REMINDER COUNT
# ============================================================

def get_reminder_count(uid):
    """
    Count reminders belonging to the user.
    """

    if not uid:
        return 0

    try:

        snapshots = (
            db.collection("reminders")
            .where(
                "userId",
                "==",
                uid
            )
            .stream()
        )

        return sum(
            1 for _ in snapshots
        )

    except Exception as error:

        print(
            f"Reminder count error for {uid}:",
            error
        )

        return 0


# ============================================================
# BUILD ADMIN USER OBJECT
# ============================================================

def build_user_object(
    uid,
    profile_data=None,
    auth_user=None,
    include_statistics=True,
):
    """
    Build a complete Admin Dashboard user object.

    Firestore is the primary source for profile information.
    Firebase Authentication provides account status and
    administrator information.
    """

    profile_data = profile_data or {}

    # --------------------------------------------------------
    # AUTH DATA
    # --------------------------------------------------------

    auth_email = ""

    email_verified = False

    disabled = False

    is_admin = False

    display_name_from_auth = ""

    created_at_from_auth = None

    if auth_user:

        auth_email = (
            auth_user.email
            or ""
        )

        email_verified = (
            auth_user.email_verified
        )

        disabled = (
            auth_user.disabled
        )

        display_name_from_auth = (
            auth_user.display_name
            or ""
        )

        claims = (
            auth_user.custom_claims
            or {}
        )

        is_admin = (
            claims.get(
                "admin",
                False
            )
            is True
        )

        created_at_from_auth = (
            serialize_value(
                auth_user.user_metadata.creation_timestamp
                if auth_user.user_metadata
                else None
            )
        )

    # --------------------------------------------------------
    # FIRESTORE PROFILE DATA
    # --------------------------------------------------------

    full_name = (
        profile_data.get(
            "fullName"
        )
        or profile_data.get(
            "displayName"
        )
        or display_name_from_auth
        or "Unnamed User"
    )

    display_name = (
        profile_data.get(
            "displayName"
        )
        or display_name_from_auth
        or full_name
        or "Unnamed User"
    )

    email = (
        profile_data.get(
            "email"
        )
        or auth_email
        or ""
    )

    date_of_birth = (
        profile_data.get(
            "dateOfBirth"
        )
        or ""
    )

    instagram_profile = (
        profile_data.get(
            "instagramProfile"
        )
        or ""
    )

    # --------------------------------------------------------
    # FIRESTORE TIMESTAMPS
    # --------------------------------------------------------

    created_at = serialize_value(
        profile_data.get(
            "createdAt"
        )
    )

    updated_at = serialize_value(
        profile_data.get(
            "updatedAt"
        )
    )

    # --------------------------------------------------------
    # STATISTICS
    # --------------------------------------------------------

    prediction_count = 0

    reminder_count = 0

    if include_statistics:

        prediction_count = (
            get_prediction_count(
                uid
            )
        )

        reminder_count = (
            get_reminder_count(
                uid
            )
        )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        # ====================================================
        # IDENTIFICATION
        # ====================================================

        "uid": uid,

        # ====================================================
        # PROFILE
        # ====================================================

        "email": email,

        "fullName": full_name,

        "displayName": display_name,

        "dateOfBirth": date_of_birth,

        "instagramProfile": instagram_profile,

        # ====================================================
        # DATES
        # ====================================================

        "createdAt": (
            created_at
            or created_at_from_auth
        ),

        "updatedAt": updated_at,

        # ====================================================
        # FIREBASE AUTH STATUS
        # ====================================================

        "emailVerified": email_verified,

        "disabled": disabled,

        "isAdmin": is_admin,

        "authAccountExists": (
            auth_user is not None
        ),

        # ====================================================
        # APPLICATION STATISTICS
        # ====================================================

        "predictionCount": (
            prediction_count
        ),

        "reminderCount": (
            reminder_count
        ),
    }


# ============================================================
# GET ALL USERS
# ============================================================

def get_all_users():

    users = []

    print(
        "\n=============================================="
    )

    print(
        "LOADING USERS FROM FIRESTORE"
    )

    print(
        "Collection: users"
    )

    print(
        "=============================================="
    )

    try:

        # ----------------------------------------------------
        # IMPORTANT
        #
        # We now read directly from:
        #
        # Firestore -> users
        #
        # instead of:
        #
        # Firebase Authentication -> list_users()
        # ----------------------------------------------------

        profile_snapshots = (
            db.collection("users")
            .stream()
        )

        for snapshot in profile_snapshots:

            uid = snapshot.id

            profile_data = (
                snapshot.to_dict()
                or {}
            )

            # ------------------------------------------------
            # GET AUTH ACCOUNT
            # ------------------------------------------------

            auth_user = (
                get_auth_user(
                    uid
                )
            )

            # ------------------------------------------------
            # BUILD USER
            # ------------------------------------------------

            user = build_user_object(

                uid=uid,

                profile_data=profile_data,

                auth_user=auth_user,

                include_statistics=True,
            )

            users.append(
                user
            )

        # ----------------------------------------------------
        # SORT USERS
        # ----------------------------------------------------

        users.sort(
            key=lambda user: (
                user.get(
                    "fullName",
                    ""
                )
                or ""
            ).lower()
        )

        # ----------------------------------------------------
        # LOG
        # ----------------------------------------------------

        print(
            f"Total Firestore users: {len(users)}"
        )

        print(
            "==============================================\n"
        )

        return users

    except Exception as error:

        print(
            "Get all users error:",
            error
        )

        raise


# ============================================================
# GET SINGLE USER
# ============================================================

def get_user_details(uid):

    if not uid:

        raise ValueError(
            "User ID is required."
        )

    # --------------------------------------------------------
    # FIRESTORE PROFILE
    # --------------------------------------------------------

    profile_data = get_profile(
        uid
    )

    # --------------------------------------------------------
    # FIREBASE AUTH ACCOUNT
    # --------------------------------------------------------

    auth_user = get_auth_user(
        uid
    )

    # --------------------------------------------------------
    # IF NEITHER EXISTS
    # --------------------------------------------------------

    if not profile_data and not auth_user:

        raise auth.UserNotFoundError(
            "User does not exist."
        )

    # --------------------------------------------------------
    # BUILD COMPLETE USER
    # --------------------------------------------------------

    return build_user_object(

        uid=uid,

        profile_data=profile_data,

        auth_user=auth_user,

        include_statistics=True,
    )


# ============================================================
# DELETE PREDICTIONS
# ============================================================

def delete_user_predictions(uid):

    if not uid:
        return

    try:

        snapshots = (
            db.collection("predictions")
            .where(
                "userId",
                "==",
                uid
            )
            .stream()
        )

        deleted_count = 0

        for snapshot in snapshots:

            snapshot.reference.delete()

            deleted_count += 1

        print(
            f"Deleted {deleted_count} predictions "
            f"for user {uid}"
        )

    except Exception as error:

        print(
            f"Prediction deletion error for {uid}:",
            error
        )

        raise


# ============================================================
# DELETE REMINDERS
# ============================================================

def delete_user_reminders(uid):

    if not uid:
        return

    try:

        snapshots = (
            db.collection("reminders")
            .where(
                "userId",
                "==",
                uid
            )
            .stream()
        )

        deleted_count = 0

        for snapshot in snapshots:

            snapshot.reference.delete()

            deleted_count += 1

        print(
            f"Deleted {deleted_count} reminders "
            f"for user {uid}"
        )

    except Exception as error:

        print(
            f"Reminder deletion error for {uid}:",
            error
        )

        raise


# ============================================================
# DELETE FIRESTORE PROFILE
# ============================================================

def delete_user_profile(uid):

    if not uid:
        return

    try:

        profile_ref = (
            db.collection("users")
            .document(uid)
        )

        snapshot = (
            profile_ref.get()
        )

        if snapshot.exists:

            profile_ref.delete()

            print(
                f"Deleted Firestore profile: {uid}"
            )

        else:

            print(
                f"No Firestore profile found: {uid}"
            )

    except Exception as error:

        print(
            f"Firestore profile deletion error "
            f"for {uid}:",
            error
        )

        raise


# ============================================================
# DELETE FIREBASE AUTH ACCOUNT
# ============================================================

def delete_auth_user(uid):

    if not uid:
        return

    try:

        auth.delete_user(
            uid
        )

        print(
            f"Deleted Firebase Auth account: {uid}"
        )

    except auth.UserNotFoundError:

        # ----------------------------------------------------
        # The Firestore profile can exist even if the Auth
        # account has already been removed.
        # ----------------------------------------------------

        print(
            f"Firebase Auth account not found: {uid}"
        )

    except Exception as error:

        print(
            f"Firebase Auth deletion error "
            f"for {uid}:",
            error
        )

        raise


# ============================================================
# DELETE USER
# ============================================================

def delete_user(uid):

    if not uid:

        raise ValueError(
            "User ID is required."
        )

    print(
        "\n=============================================="
    )

    print(
        f"DELETING USER: {uid}"
    )

    print(
        "=============================================="
    )

    # --------------------------------------------------------
    # CHECK WHETHER USER EXISTS
    # --------------------------------------------------------

    profile_data = get_profile(
        uid
    )

    auth_user = get_auth_user(
        uid
    )

    if not profile_data and not auth_user:

        raise auth.UserNotFoundError(
            "User not found."
        )

    # --------------------------------------------------------
    # DELETE PREDICTIONS
    # --------------------------------------------------------

    delete_user_predictions(
        uid
    )

    # --------------------------------------------------------
    # DELETE REMINDERS
    # --------------------------------------------------------

    delete_user_reminders(
        uid
    )

    # --------------------------------------------------------
    # DELETE FIRESTORE USER PROFILE
    # --------------------------------------------------------

    delete_user_profile(
        uid
    )

    # --------------------------------------------------------
    # DELETE FIREBASE AUTH ACCOUNT
    # --------------------------------------------------------

    delete_auth_user(
        uid
    )

    print(
        "User deletion completed."
    )

    print(
        "==============================================\n"
    )

    return True


# ============================================================
# ADMIN DASHBOARD STATISTICS
# ============================================================

def get_admin_statistics():

    # --------------------------------------------------------
    # TOTAL USERS
    #
    # IMPORTANT:
    # This is based on Firestore users collection.
    # --------------------------------------------------------

    try:

        user_snapshots = (
            db.collection("users")
            .stream()
        )

        total_users = sum(
            1
            for _ in user_snapshots
        )

    except Exception as error:

        print(
            "Total users count error:",
            error
        )

        total_users = 0

    # --------------------------------------------------------
    # TOTAL PREDICTIONS
    # --------------------------------------------------------

    try:

        prediction_snapshots = (
            db.collection("predictions")
            .stream()
        )

        total_predictions = sum(
            1
            for _ in prediction_snapshots
        )

    except Exception as error:

        print(
            "Total predictions count error:",
            error
        )

        total_predictions = 0

    # --------------------------------------------------------
    # TOTAL REMINDERS
    # --------------------------------------------------------

    try:

        reminder_snapshots = (
            db.collection("reminders")
            .stream()
        )

        total_reminders = sum(
            1
            for _ in reminder_snapshots
        )

    except Exception as error:

        print(
            "Total reminders count error:",
            error
        )

        total_reminders = 0

    # --------------------------------------------------------
    # TOTAL ADMINISTRATORS
    #
    # Firebase Auth custom claim remains the source for
    # administrator status.
    # --------------------------------------------------------

    total_administrators = 0

    try:

        page = auth.list_users()

        while page:

            for auth_user in page.users:

                claims = (
                    auth_user.custom_claims
                    or {}
                )

                if (
                    claims.get(
                        "admin",
                        False
                    )
                    is True
                ):

                    total_administrators += 1

            page = (
                page.get_next_page()
            )

    except Exception as error:

        print(
            "Administrator count error:",
            error
        )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    statistics = {

        "totalUsers": (
            total_users
        ),

        "totalPredictions": (
            total_predictions
        ),

        "totalReminders": (
            total_reminders
        ),

        "totalAdministrators": (
            total_administrators
        ),
    }

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

    return statistics