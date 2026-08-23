import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { auth } from "./firebase";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Prediction from "./pages/prediction";
import History from "./pages/history";
import Reminders from "./pages/reminders";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // FIREBASE AUTHENTICATION LISTENER
  // ==========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================================
  // AUTHENTICATION LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  // ==========================================================
  // APPLICATION ROUTES
  // ==========================================================

  return (
    <BrowserRouter>
      <Routes>

        {/* ====================================================
            HOME
        ==================================================== */}

        <Route
          path="/"
          element={
            user ? (
              <Dashboard user={user} />
            ) : (
              <Login />
            )
          }
        />


        {/* ====================================================
            LOGIN
        ==================================================== */}

        <Route
          path="/login"
          element={
            user ? (
              <Dashboard user={user} />
            ) : (
              <Login />
            )
          }
        />


        {/* ====================================================
            REGISTRATION
        ==================================================== */}

        <Route
          path="/register"
          element={
            user ? (
              <Dashboard user={user} />
            ) : (
              <Register />
            )
          }
        />


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            AI ENGAGEMENT PREDICTION
        ==================================================== */}

        <Route
          path="/prediction"
          element={
            <ProtectedRoute user={user}>
              <Prediction user={user} />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            PREDICTION HISTORY
        ==================================================== */}

        <Route
          path="/history"
          element={
            <ProtectedRoute user={user}>
              <History user={user} />
            </ProtectedRoute>
          }
        />


        {/* ====================================================
            INSTAGRAM POST REMINDERS
        ==================================================== */}

        <Route
          path="/reminders"
          element={
            <ProtectedRoute user={user}>
              <Reminders user={user} />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;