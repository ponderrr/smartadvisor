import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles, Menu, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
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
                  className={`nav-link ${isActivePage("/questions") ? "active" : ""}`}
                >
                  Get Recommendations
                </Link>
                <Link
                  to="/account"
                  className={`nav-link ${location.pathname.startsWith("/account") ? "active" : ""}`}
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
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isLoading ? (
              <div className="auth-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="user-menu">
                <div className="user-info glass">
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
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/signin" className="btn-glass">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="mobile-menu-button glass"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav glass">
            <div className="mobile-nav-content">
              <Link
                to="/"
                className={`mobile-nav-link ${isActivePage("/") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/questions"
                    className={`mobile-nav-link ${isActivePage("/questions") ? "active" : ""}`}
                    onClick={closeMenu}
                  >
                    Get Recommendations
                  </Link>
                  <Link
                    to="/account"
                    className={`mobile-nav-link ${location.pathname.startsWith("/account") ? "active" : ""}`}
                    onClick={closeMenu}
                  >
                    My Account
                  </Link>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="mobile-nav-link"
                  onClick={closeMenu}
                >
                  Get Started
                </Link>
              )}

              <div className="mobile-nav-divider"></div>

              {isAuthenticated ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
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
                    className="btn-outline mobile-logout-btn"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link to="/signin" className="btn-glass" onClick={closeMenu}>
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
