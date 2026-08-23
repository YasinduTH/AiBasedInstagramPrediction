import firebase_admin

from firebase_admin import credentials, auth


# ============================================================
# FIREBASE ADMIN SDK CONFIGURATION
# ============================================================

SERVICE_ACCOUNT_FILE = "firebase-admin-key.json"


# ============================================================
# INITIALIZE FIREBASE ADMIN
# ============================================================

cred = credentials.Certificate(
    SERVICE_ACCOUNT_FILE
)

firebase_admin.initialize_app(cred)


# ============================================================
# GET ADMIN EMAIL
# ============================================================

ADMIN_EMAIL = input(
    "Enter the email of the user you want to make admin: "
).strip()


if not ADMIN_EMAIL:
    raise ValueError(
        "Admin email cannot be empty."
    )


# ============================================================
# FIND FIREBASE AUTH USER
# ============================================================

try:

    user = auth.get_user_by_email(
        ADMIN_EMAIL
    )

except auth.UserNotFoundError:

    print(
        "\nERROR: No Firebase Authentication "
        "user exists with this email."
    )

    print(
        "Create the account through your normal "
        "registration page first."
    )

    raise SystemExit(1)


# ============================================================
# SET ADMIN CUSTOM CLAIM
# ============================================================

auth.set_custom_user_claims(
    user.uid,
    {
        "admin": True
    }
)


# ============================================================
# RESULT
# ============================================================

print("\n" + "=" * 60)

print("ADMIN ROLE CREATED SUCCESSFULLY")

print("=" * 60)

print(f"Email: {user.email}")

print(f"UID: {user.uid}")

print("Admin: True")

print("=" * 60)

print("\nIMPORTANT:")

print(
    "Sign out and sign in again in the application "
    "before testing the admin dashboard."
)