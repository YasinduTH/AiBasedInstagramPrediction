import { useState } from "react";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { Link, useNavigate } from "react-router-dom";

import { auth } from "../firebase";
import { createUserProfile } from "../services/firestoreService";

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      // ==========================================
      // STEP 1 — CREATE FIREBASE AUTH ACCOUNT
      // ==========================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      console.log(
        "Firebase Authentication account created:",
        user.uid
      );

      // ==========================================
      // STEP 2 — CREATE FIRESTORE USER PROFILE
      // ==========================================

      await createUserProfile(user);

      console.log(
        "Firestore user profile created successfully."
      );

      // ==========================================
      // STEP 3 — GO TO DASHBOARD
      // ==========================================

      navigate("/dashboard");

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      switch (err.code) {
        case "auth/email-already-in-use":
          setError(
            "An account already exists with this email."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          setError(
            "Password is too weak."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            err.message ||
            "Registration failed. Please try again."
          );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          AI Instagram Prediction
        </p>

        {/* ERROR MESSAGE */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* REGISTRATION FORM */}

        <form onSubmit={handleRegister}>

          {/* EMAIL */}

          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            style={styles.input}
          />

          {/* PASSWORD */}

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            minLength={6}
            style={styles.input}
          />

          {/* CONFIRM PASSWORD */}

          <label style={styles.label}>
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
            minLength={6}
            style={styles.input}
          />

          {/* REGISTER BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        {/* LOGIN LINK */}

        <p style={styles.footer}>

          Already have an account?{" "}

          <Link
            to="/login"
            style={styles.link}
          >
            Sign In
          </Link>

        </p>

      </div>

    </div>
  );
}

const styles = {

  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },

  card: {
    width: "380px",
    maxWidth: "100%",
    padding: "35px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.3)",
  },

  title: {
    margin: "0",
    fontSize: "32px",
    color: "#0f172a",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "25px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    marginTop: "15px",
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "13px",
    marginTop: "25px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
  },

  error: {
    padding: "12px",
    marginBottom: "15px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    fontSize: "14px",
  },

  footer: {
    marginTop: "20px",
    textAlign: "center",
    color: "#64748b",
  },

  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },

};

export default Register;