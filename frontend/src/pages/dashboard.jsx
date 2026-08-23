import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>AI Instagram Dashboard</h1>

        <p>
          Welcome!
        </p>

        <div style={styles.userBox}>
          <strong>Logged-in Email:</strong>

          <p>{user?.email}</p>

          <strong>User UID:</strong>

          <p style={styles.uid}>
            {user?.uid}
          </p>
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
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
  },

  card: {
    width: "500px",
    padding: "40px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },

  userBox: {
    margin: "25px 0",
    padding: "20px",
    background: "#f1f5f9",
    borderRadius: "10px",
  },

  uid: {
    fontSize: "12px",
    wordBreak: "break-all",
    color: "#475569",
  },
};

export default Dashboard;