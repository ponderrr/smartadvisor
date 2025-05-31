// client/src/components/layout/Navbar/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "primereact/button";
import { Menu as PrimeMenu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { classNames } from "primereact/utils";
import { Badge } from "primereact/badge";
import logo from "../../../assets/smartadvisor.svg";
import "./Navbar.css";
import { TieredMenu } from "primereact/tieredmenu";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const location = useLocation();
  const menu = useRef<TieredMenu>(null);

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
            <img src={logo} alt="SmartAdvisor Logo" className="logo-image" />
            <span className="beta-badge">BETA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link
              to="/subscription"
              className={`nav-link ${isActivePage("/subscription") ? "active" : ""}`}
            >
              Plans
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
              </>
            ) : null}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            <Button
              onClick={toggleTheme}
              className="theme-toggle p-button-text"
              aria-label="Toggle theme"
              rounded
              icon={
                isDarkMode ? (
                  <i
                    className="pi pi-sun sun-icon"
                    style={{ fontSize: "1.25rem" }}
                  />
                ) : (
                  <i
                    className="pi pi-moon moon-icon"
                    style={{ fontSize: "1.25rem" }}
                  />
                )
              }
            />

            {isLoading ? (
              <div className="auth-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="user-menu">
                <Button
                  className="p-button-text user-profile-btn"
                  onClick={(e) => menu.current?.toggle(e)}
                  aria-controls="profile-menu"
                  aria-haspopup
                >
                  <Avatar
                    image={user?.profile_picture_url}
                    label={(user?.username || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                    shape="circle"
                    size="normal"
                    style={{ backgroundColor: "#00955f", color: "#ffffff" }}
                  />
                  <span className="username-text">
                    {user?.username || "User"}
                  </span>
                  <i
                    className="pi pi-angle-down"
                    style={{ marginLeft: "0.5rem" }}
                  ></i>
                </Button>
                <PrimeMenu
                  model={[
                    {
                      template: (item, options) => {
                        return (
                          <button
                            onClick={(e) => options.onClick(e)}
                            className={classNames(
                              options.className,
                              "w-full p-link flex align-items-center p-3 pl-4 text-color hover:surface-200 border-noround",
                            )}
                          >
                            <Avatar
                              image={user?.profile_picture_url}
                              label={(user?.username || user?.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                              shape="circle"
                              size="large"
                              style={{
                                backgroundColor: "#00955f",
                                color: "#ffffff",
                              }}
                              className="mr-2"
                            />
                            <div
                              className="flex flex-column"
                              style={{ marginLeft: "0.75rem" }}
                            >
                              <span
                                className="font-bold"
                                style={{ marginBottom: "0.25rem" }}
                              >
                                {user?.username || "User"}
                              </span>
                              <span className="text-sm text-500">
                                {user?.email}
                              </span>
                            </div>
                          </button>
                        );
                      },
                    },
                    { separator: true },
                    {
                      label: "My Profile",
                      command: () => navigate("/account/profile?tab=profile"),
                    },

                    {
                      label: "My Recommendations",
                      command: () => navigate("/account?tab=history"),
                    },
                    { separator: true },
                    {
                      label: "Sign Out",
                      command: () => handleLogout(),
                    },
                  ]}
                  popup
                  ref={menu}
                  id="profile-menu"
                />
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/signin">
                  <Button
                    className="p-button-text auth-button"
                    size="large"
                    pt={{
                      root: { style: { background: "transparent" } },
                      label: { style: { fontWeight: 500 } },
                    }}
                    label="Sign In"
                  />
                </Link>
                <Link to="/signup">
                  <Button
                    className="auth-button-primary"
                    size="large"
                    pt={{
                      root: { style: { background: "#00955f" } },
                      label: { style: { fontWeight: 500 } },
                    }}
                    label="Sign Up"
                  />
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              onClick={toggleMenu}
              className="mobile-menu-button p-button-text"
              aria-label="Toggle menu"
              rounded
              icon={isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-content">
              <Link
                to="/subscription"
                className={`mobile-nav-link ${
                  isActivePage("/subscription") ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                Plans
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
