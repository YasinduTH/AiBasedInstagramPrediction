import History from "./pages/history";
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
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Firebase authentication is still loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
  path="/history"
  element={
    <ProtectedRoute user={user}>
      <History user={user} />
    </ProtectedRoute>
  }
/>

        {/* Home */}
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

        {/* Login */}
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

        {/* Registration */}
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

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />

        {/* AI Engagement Prediction */}
        <Route
          path="/prediction"
          element={
            <ProtectedRoute user={user}>
              <Prediction />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;