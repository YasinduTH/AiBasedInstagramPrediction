import { auth } from "../firebase";

// ============================================================
// FLASK BACKEND URL
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000";

// ============================================================
// GET CURRENT FIREBASE AUTHENTICATION TOKEN
// ============================================================

async function getAuthToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to access the admin dashboard."
    );
  }

  try {
    // Force Firebase to refresh the ID token
    const token = await user.getIdToken(true);

    if (!token) {
      throw new Error(
        "Unable to obtain Firebase authentication token."
      );
    }

    console.log(
      "Firebase authentication token obtained successfully."
    );

    return token;
  } catch (error) {
    console.error(
      "Firebase token error:",
      error
    );

    throw new Error(
      "Unable to authenticate with Firebase. Please sign out and sign in again."
    );
  }
}

// ============================================================
// ADMIN API REQUEST HELPER
// ============================================================

async function adminRequest(
  endpoint,
  options = {}
) {
  // ----------------------------------------------------------
  // GET FRESH FIREBASE TOKEN
  // ----------------------------------------------------------

  const token = await getAuthToken();

  // ----------------------------------------------------------
  // PREPARE HEADERS
  // ----------------------------------------------------------

  const headers = {
    ...(options.headers || {}),

    Authorization: `Bearer ${token}`,

    "Content-Type": "application/json",
  };

  // ----------------------------------------------------------
  // SEND REQUEST
  // ----------------------------------------------------------

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "Admin API network error:",
      error
    );

    throw new Error(
      "Unable to connect to the Flask backend. Make sure the backend server is running."
    );
  }

  // ----------------------------------------------------------
  // READ RESPONSE
  // ----------------------------------------------------------

  let data = null;

  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json")
  ) {
    try {
      data = await response.json();
    } catch (error) {
      console.error(
        "Failed to parse JSON response:",
        error
      );
    }
  } else {
    try {
      const text = await response.text();

      data = text
        ? { message: text }
        : null;
    } catch {
      data = null;
    }
  }

  // ----------------------------------------------------------
  // DEBUG INFORMATION
  // ----------------------------------------------------------

  console.log(
    "Admin API:",
    endpoint,
    "Status:",
    response.status
  );

  // ----------------------------------------------------------
  // AUTHENTICATION ERROR
  // ----------------------------------------------------------

  if (response.status === 401) {
    console.error(
      "Firebase authentication rejected by Flask:",
      data
    );

    throw new Error(
      data?.error ||
      data?.message ||
      "Invalid or expired authentication token. Please sign out and sign in again."
    );
  }

  // ----------------------------------------------------------
  // ADMIN PERMISSION ERROR
  // ----------------------------------------------------------

  if (response.status === 403) {
    console.error(
      "Admin permission denied:",
      data
    );

    throw new Error(
      data?.error ||
      data?.message ||
      "Access denied. Administrator privileges are required."
    );
  }

  // ----------------------------------------------------------
  // NOT FOUND
  // ----------------------------------------------------------

  if (response.status === 404) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Admin API endpoint was not found: ${endpoint}`
    );
  }

  // ----------------------------------------------------------
  // SERVER ERROR
  // ----------------------------------------------------------

  if (response.status >= 500) {
    console.error(
      "Flask server error:",
      data
    );

    throw new Error(
      data?.error ||
      data?.message ||
      "The Flask backend returned a server error."
    );
  }

  // ----------------------------------------------------------
  // OTHER API ERRORS
  // ----------------------------------------------------------

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Admin API request failed (${response.status}).`
    );
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return data;
}

// ============================================================
// ADMIN HEALTH CHECK
// ============================================================

export async function getAdminHealth() {
  return adminRequest(
    "/api/admin/health"
  );
}

// ============================================================
// GET ALL USERS
// ============================================================

export async function getAdminUsers() {
  return adminRequest(
    "/api/admin/users"
  );
}

// ============================================================
// GET SINGLE USER
// ============================================================

export async function getAdminUser(uid) {
  if (!uid) {
    throw new Error(
      "User ID is required."
    );
  }

  return adminRequest(
    `/api/admin/users/${encodeURIComponent(uid)}`
  );
}

// ============================================================
// DELETE USER
// ============================================================

export async function deleteAdminUser(uid) {
  if (!uid) {
    throw new Error(
      "User ID is required."
    );
  }

  return adminRequest(
    `/api/admin/users/${encodeURIComponent(uid)}`,
    {
      method: "DELETE",
    }
  );
}

// ============================================================
// EXPORT TOKEN HELPER
// ============================================================
// Useful if another admin-related component needs the token.
// ============================================================

export async function getFreshAdminToken() {
  return getAuthToken();
}