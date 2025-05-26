// client/src/components/layout/Navbar/index.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles, Menu, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "./Navbar.css"; // Keep only one CSS import

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo Section */}
          <Link to="/" className="logo-section" onClick={closeMenu}>
            <div className="logo-icon glass-primary">
              <Sparkles size={24} />
            </div>
            <span className="logo-text">SmartAdvisor</span>
            <span className="beta-badge">BETA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link
              to="/"
              className={`nav-link ${isActivePage("/") ? "active" : ""}`}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/questions"
                  className={`nav-link ${
                    isActivePage("/questions") ? "active" : ""
                  }`}
                >
                  Get Recommendations
                </Link>
                <Link
                  to="/account"
                  className={`nav-link ${
                    location.pathname.startsWith("/account") ? "active" : ""
                  }`}
                >
                  My Account
                </Link>
              </>
            ) : (
              <Link to="/signin" className="nav-link">
                Get Started
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle glass"
              aria-label="Toggle theme"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px",
                color: "white",
                cursor: "pointer",
              }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isLoading ? (
              <div className="auth-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="user-menu">
                <div
                  className="user-info glass"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                  }}
                >
                  <div className="user-avatar">
                    {user?.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.username || "User"}
                        className="avatar-image"
                      />
                    ) : (
                      <span className="avatar-text">
                        {(user?.username || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="user-details">
                    <span className="user-name">
                      {user?.username || "User"}
                    </span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-outline logout-btn"
                  style={{
                    background: "transparent",
                    border: "2px solid #10b77f",
                    color: "#10b77f",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div
                className="auth-buttons"
                style={{ display: "flex", gap: "12px" }}
              >
                <Link
                  to="/signin"
                  className="btn-glass"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #10b77f, #059669)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="mobile-menu-button glass"
              aria-label="Toggle menu"
              style={{
                display: "none",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px",
                color: "white",
                cursor: "pointer",
              }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            className="mobile-nav glass"
            style={{
              position: "absolute",
              top: "100%",
              left: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div className="mobile-nav-content">
              <Link
                to="/"
                className={`mobile-nav-link ${
                  isActivePage("/") ? "active" : ""
                }`}
                onClick={closeMenu}
                style={{
                  display: "block",
                  padding: "16px",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  background: isActivePage("/")
                    ? "rgba(16, 183, 127, 0.2)"
                    : "transparent",
                }}
              >
                Home
              </Link>
              {/* Add other mobile nav links with similar styling */}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
