import React from "react";
import { Link } from "react-router-dom";
import { 
  BarChart2, 
  ArrowRight
} from "lucide-react";
import logo from "../assets/logo.png";

const Home = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      {/* HEADER / NAVIGATION */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "1rem 5%", 
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src={logo} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            AI-Based Instagram Prediction & Content Optimization
          </h1>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link to="/login" style={{ 
            color: "var(--text-secondary)", 
            fontWeight: "500", 
            fontSize: "0.95rem" 
          }}>
            Sign In
          </Link>
          <Link to="/register" style={{ 
            backgroundColor: "var(--accent-primary)", 
            color: "white", 
            padding: "0.5rem 1.25rem", 
            borderRadius: "var(--radius-md)",
            fontWeight: "500",
            fontSize: "0.95rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
          >
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* HERO SECTION */}
        <section style={{ 
          padding: "6rem 5%", 
          textAlign: "center", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
          flex: 1,
          justifyContent: "center"
        }}>
          <h2 style={{ 
            fontSize: "clamp(2.5rem, 5vw, 4rem)", 
            fontWeight: "800", 
            color: "var(--text-primary)", 
            marginBottom: "1rem",
            lineHeight: 1.2,
            maxWidth: "800px"
          }}>
            AI-Powered Instagram Engagement Prediction
          </h2>
          <h3 className="text-gradient" style={{ 
            fontSize: "clamp(1.5rem, 3vw, 2rem)", 
            fontWeight: "700", 
            marginBottom: "1.5rem" 
          }}>
            Predict. Optimize. Grow.
          </h3>
          <p style={{ 
            fontSize: "1.125rem", 
            color: "var(--text-secondary)", 
            maxWidth: "600px", 
            marginBottom: "2.5rem",
            lineHeight: 1.6
          }}>
            Analyse your Instagram content using Artificial Intelligence and Machine Learning. Predict engagement, optimize your posts and make smarter content decisions before publishing.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/register" style={{ 
              backgroundColor: "var(--accent-primary)", 
              color: "white", 
              padding: "0.75rem 2rem", 
              borderRadius: "var(--radius-md)",
              fontWeight: "600",
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "var(--shadow-md)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              Get Started
            </Link>
            <Link to="/login" style={{ 
              backgroundColor: "transparent", 
              color: "var(--text-primary)", 
              padding: "0.75rem 2rem", 
              borderRadius: "var(--radius-md)",
              fontWeight: "600",
              fontSize: "1rem",
              border: "1px solid var(--border-color)",
              display: "inline-flex",
              alignItems: "center",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign In
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ 
        padding: "2rem 5%", 
        borderTop: "1px solid var(--border-light)", 
        backgroundColor: "var(--bg-primary)",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "500", color: "var(--text-secondary)" }}>
            <img src={logo} alt="Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
            <span>AI-Based Instagram Prediction & Content Optimization</span>
          </div>
          <p>© 2026 All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
