import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./AccountPage.css";

// Mock user data
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://i.pravatar.cc/150?img=68",
  joinDate: "January 2024",
};

// Mock recommendation history
const mockRecommendations = [
  {
    id: 1,
    type: "Book",
    title: "The Silent Patient",
    date: "2024-02-15",
    description: "A psychological thriller about a woman's act of violence against her husband",
  },
  {
    id: 2,
    type: "Movie",
    title: "Dune",
    date: "2024-02-10",
    description: "Epic science fiction film based on Frank Herbert's novel",
  },
  {
    id: 3,
    type: "Book",
    title: "Project Hail Mary",
    date: "2024-01-28",
    description: "Science fiction novel by Andy Weir about a lone astronaut who must save humanity",
  },
  {
    id: 4,
    type: "Movie",
    title: "Everything Everywhere All at Once",
    date: "2024-01-15",
    description: "A middle-aged Chinese immigrant is swept up in an insane adventure",
  },
];

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "history" | "settings">("profile");
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [emailNotifications, setEmailNotifications] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="page-container account-page">
      <div className="container">
        <h1 className="account-title">My Account</h1>

        <div className="account-layout">
          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="account-user">
              <img src={mockUser.avatar} alt={mockUser.name} className="user-avatar" />
              <div className="user-info">
                <h3 className="user-name">{mockUser.name}</h3>
                <p className="user-email">{mockUser.email}</p>
                <p className="user-joined">Joined {mockUser.joinDate}</p>
              </div>
            </div>

            <nav className="account-nav">
              <button
                className={`account-nav-link ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
              <button
                className={`account-nav-link ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Recommendation History
              </button>
              <button
                className={`account-nav-link ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </nav>

            <div className="sidebar-footer">
              <Link to="/" className="back-to-home">
                Back to Home
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="account-content">
            {activeTab === "profile" && (
              <div className="profile-tab">
                <h2 className="content-title">Profile Information</h2>
                <div className="profile-form">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-input"
                      defaultValue={mockUser.name}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      defaultValue={mockUser.email}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Change Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="form-input"
                      placeholder="New password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm-password" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="form-input"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="btn-primary update-profile-btn">
                    Update Profile
                  </button>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="history-tab">
                <h2 className="content-title">Recommendation History</h2>
                
                {mockRecommendations.length === 0 ? (
                  <div className="empty-history">
                    <p>You haven't received any recommendations yet.</p>
                    <Link to="/questions" className="btn-primary">
                      Get Your First Recommendation
                    </Link>
                  </div>
                ) : (
                  <div className="recommendations-list">
                    {mockRecommendations.map((recommendation) => (
                      <div key={recommendation.id} className="recommendation-card">
                        <div className="recommendation-header">
                          <span className={`recommendation-type ${recommendation.type.toLowerCase()}`}>
                            {recommendation.type}
                          </span>
                          <span className="recommendation-date">
                            {formatDate(recommendation.date)}
                          </span>
                        </div>
                        <h3 className="recommendation-title">{recommendation.title}</h3>
                        <p className="recommendation-description">
                          {recommendation.description}
                        </p>
                        <div className="recommendation-actions">
                          <button className="action-button save">Save</button>
                          <button className="action-button share">Share</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="settings-tab">
                <h2 className="content-title">Account Settings</h2>
                
                <div className="settings-section">
                  <h3 className="settings-subtitle">Appearance</h3>
                  <div className="setting-option">
                    <div className="setting-label">
                      <span>Dark Mode</span>
                      <p className="setting-description">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <div className="toggle-wrapper">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={() => setDarkMode(!darkMode)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="settings-subtitle">Notifications</h3>
                  <div className="setting-option">
                    <div className="setting-label">
                      <span>Email Notifications</span>
                      <p className="setting-description">
                        Receive updates about new recommendations
                      </p>
                    </div>
                    <div className="toggle-wrapper">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="settings-subtitle">Account Management</h3>
                  <div className="setting-actions">
                    <button className="btn-secondary">Download My Data</button>
                    <button className="btn-danger">Delete Account</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;