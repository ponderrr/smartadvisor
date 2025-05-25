import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import ProfileDropdown from "../ProfileDropdown";
import { useAuth } from "../../../context/AuthContext";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
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

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo-section">
            <div className="logo-icon">
              <img 
                src={isDarkMode ? "/src/assets/Smart Advisor LM Logo.svg" : "/src/assets/Smart Advisor DM Logo .svg"} 
                alt="SmartAdvisor Logo" 
                className="logo-image"
              />
            </div>
            <span className="logo-text">SmartAdvisor</span>
            <span className="beta-badge">BETA</span>
          </Link>

          {/* Mobile menu button */}
          <button 
            className="mobile-menu-button" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
          </button>

          <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link 
              to="/questions" 
              className={`nav-link ${location.pathname === '/questions' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Get Recommendations
            </Link>
            {!isAuthenticated && (
              <Link 
                to="/questions" 
                className={`nav-link ${location.pathname === '/questions' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Get Started
              </Link>
            )}
          </nav>

          <div className="navbar-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="theme-icon" />
              ) : (
                <Moon className="theme-icon" />
              )}
            </button>
            {isAuthenticated ? (
              <ProfileDropdown 
                user={{
                  name: user?.username || 'User',
                  email: user?.email || '',
                  avatar: user?.profile_picture_url
                }}
                onSignOut={logout}
              />
            ) : (
              <Link to="/signin" className="signin-button">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;