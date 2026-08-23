import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";


function AdminRoute({ user, children }) {

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);


  // ==========================================================
  // CHECK ADMIN ROLE
  // ==========================================================

  useEffect(() => {

    const checkAdmin = async () => {

      // ------------------------------------------------------
      // No logged-in user
      // ------------------------------------------------------

      if (!user) {

        setIsAdmin(false);
        setChecking(false);

        return;
      }


      try {

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnapshot =
          await getDoc(userRef);


        if (userSnapshot.exists()) {

          const userData =
            userSnapshot.data();

          setIsAdmin(
            userData.admin === true
          );

        } else {

          setIsAdmin(false);

        }

      } catch (error) {

        console.error(
          "Admin role check failed:",
          error
        );

        setIsAdmin(false);

      } finally {

        setChecking(false);

      }

    };


    checkAdmin();

  }, [user]);


  // ==========================================================
  // CHECKING ADMIN STATUS
  // ==========================================================

  if (checking) {

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

        <div style={{ textAlign: "center" }}>

          <h2>
            Checking administrator access...
          </h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Please wait.
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ==========================================================
  // NOT ADMIN
  // ==========================================================

  if (!isAdmin) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  // ==========================================================
  // ADMIN
  // ==========================================================

  return children;

}


export default AdminRoute;