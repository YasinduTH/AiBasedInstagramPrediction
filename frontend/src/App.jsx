import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

// ==========================================================
// PAGES
// ==========================================================

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Prediction from "./pages/prediction";
import History from "./pages/history";
import Reminders from "./pages/reminders";
import AdminDashboard from "./pages/adminDashboard";

// ==========================================================
// COMPONENTS
// ==========================================================

import ProtectedRoute from "./components/ProtectedRoute";

// ==========================================================
// CHECK WHETHER USER IS ADMIN
// ==========================================================

async function checkAdminStatus(user) {
  if (!user) {
    return false;
  }

  try {
    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    const userData = snapshot.data();

    return userData.admin === true;

  } catch (error) {

    console.error(
      "Failed to check admin status:",
      error
    );

    return false;
  }
}

// ==========================================================
// APP
// ==========================================================

function App() {

  const [user, setUser] = useState(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [checkingRole, setCheckingRole] =
    useState(true);


  // ========================================================
  // FIREBASE AUTHENTICATION LISTENER
  // ========================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          setUser(currentUser);

          if (!currentUser) {

            setIsAdmin(false);

            setCheckingRole(false);

            setLoading(false);

            return;
          }

          // --------------------------------------------------
          // CHECK FIRESTORE ADMIN ROLE
          // --------------------------------------------------

          setCheckingRole(true);

          const adminStatus =
            await checkAdminStatus(
              currentUser
            );

          setIsAdmin(adminStatus);

          setCheckingRole(false);

          setLoading(false);
        }
      );


    return () => unsubscribe();

  }, []);


  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (
    loading ||
    checkingRole
  ) {

    return (

      <div
        style={{
          minHeight: "100vh",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          background: "#0f172a",

          color: "#ffffff",

          fontFamily:
            "Arial, sans-serif",
        }}
      >

        <h2>
          Loading...
        </h2>

      </div>

    );
  }


  // ========================================================
  // APPLICATION ROUTES
  // ========================================================

  return (

    <BrowserRouter>

      <Routes>

        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={
            user ? (

              isAdmin ? (

                <Navigate
                  to="/admin"
                  replace
                />

              ) : (

                <Navigate
                  to="/dashboard"
                  replace
                />

              )

            ) : (

              <Navigate
                to="/login"
                replace
              />

            )
          }
        />


        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={

            user ? (

              isAdmin ? (

                <Navigate
                  to="/admin"
                  replace
                />

              ) : (

                <Navigate
                  to="/dashboard"
                  replace
                />

              )

            ) : (

              <Login />

            )

          }
        />


        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route
          path="/register"
          element={

            user ? (

              isAdmin ? (

                <Navigate
                  to="/admin"
                  replace
                />

              ) : (

                <Navigate
                  to="/dashboard"
                  replace
                />

              )

            ) : (

              <Register />

            )

          }
        />


        {/* ==================================================
            USER DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute
              user={user}
            >

              <Dashboard
                user={user}
              />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            AI PREDICTION
        ================================================== */}

        <Route
          path="/prediction"
          element={

            <ProtectedRoute
              user={user}
            >

              <Prediction
                user={user}
              />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            PREDICTION HISTORY
        ================================================== */}

        <Route
          path="/history"
          element={

            <ProtectedRoute
              user={user}
            >

              <History
                user={user}
              />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            REMINDERS
        ================================================== */}

        <Route
          path="/reminders"
          element={

            <ProtectedRoute
              user={user}
            >

              <Reminders
                user={user}
              />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            ADMIN DASHBOARD
        ================================================== */}

        <Route
          path="/admin"
          element={

            <ProtectedRoute
              user={user}
            >

              {isAdmin ? (

                <AdminDashboard
                  user={user}
                />

              ) : (

                <Navigate
                  to="/dashboard"
                  replace
                />

              )}

            </ProtectedRoute>

          }
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;