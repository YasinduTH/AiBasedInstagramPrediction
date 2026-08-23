import { useState } from "react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  auth,
  db,
} from "../firebase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      // ======================================================
      // STEP 1 — FIREBASE AUTHENTICATION
      // ======================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user =
        userCredential.user;

      console.log(
        "Firebase login successful:",
        user.email
      );

      console.log(
        "Firebase UID:",
        user.uid
      );


      // ======================================================
      // STEP 2 — GET USER PROFILE FROM FIRESTORE
      // ======================================================

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot =
        await getDoc(userRef);


      // ======================================================
      // STEP 3 — CHECK WHETHER PROFILE EXISTS
      // ======================================================

      if (!userSnapshot.exists()) {

        console.warn(
          "Firestore user profile not found."
        );

        // If there is no profile, treat as normal user
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return;
      }


      // ======================================================
      // STEP 4 — GET USER DATA
      // ======================================================

      const userData =
        userSnapshot.data();

      console.log(
        "Firestore user data:",
        userData
      );


      // ======================================================
      // STEP 5 — CHECK ADMIN ROLE
      // ======================================================

      const isAdmin =
        userData.admin === true;


      console.log(
        "Admin status:",
        isAdmin
      );


      // ======================================================
      // STEP 6 — REDIRECT BASED ON ROLE
      // ======================================================

      if (isAdmin) {

        console.log(
          "Admin detected. Redirecting to admin dashboard."
        );

        navigate(
          "/admin",
          {
            replace: true,
          }
        );

      } else {

        console.log(
          "Normal user detected. Redirecting to user dashboard."
        );

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      }

    } catch (err) {

      console.error(
        "Login error:",
        err
      );


      // ======================================================
      // FIREBASE AUTH ERRORS
      // ======================================================

      switch (err.code) {

        case "auth/invalid-credential":

          setError(
            "Invalid email or password."
          );

          break;


        case "auth/user-not-found":

          setError(
            "No account found with this email."
          );

          break;


        case "auth/wrong-password":

          setError(
            "Incorrect password."
          );

          break;


        case "auth/invalid-email":

          setError(
            "Please enter a valid email address."
          );

          break;


        case "auth/too-many-requests":

          setError(
            "Too many login attempts. Please try again later."
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
            "Login failed. Please try again."
          );
      }

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          AI Instagram Prediction
        </h1>

        <p style={styles.subtitle}>
          Sign in to your account
        </p>


        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (

          <div style={styles.error}>

            {error}

          </div>

        )}


        {/* ==================================================
            LOGIN FORM
        ================================================== */}

        <form
          onSubmit={handleLogin}
        >

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
            disabled={loading}
          />


          {/* PASSWORD */}

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            style={styles.input}
            disabled={loading}
          />


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,

              opacity:
                loading ? 0.7 : 1,

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

          </button>

        </form>


        {/* ==================================================
            REGISTER LINK
        ================================================== */}

        <p style={styles.footer}>

          Don't have an account?{" "}

          <Link
            to="/register"
            style={styles.link}
          >
            Create Account
          </Link>

        </p>

      </div>

    </div>

  );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

  container: {
    minHeight: "100vh",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background: "#0f172a",

    fontFamily:
      "Arial, sans-serif",

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

    fontSize: "28px",

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


export default Login;