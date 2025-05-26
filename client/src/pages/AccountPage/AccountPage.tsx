import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Settings,
  Crown,
  History,
  Shield,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import ProfileTab from "./components/ProfileTab";
import SecurityTab from "./components/SecurityTab";
import PreferencesTab from "./components/PreferencesTab";
import SubscriptionTab from "./components/SubscriptionTab";
import HistoryTab from "./components/HistoryTab";
import "./AccountPage.css";

// Tab configuration
const tabs = [
  { id: "profile", label: "Profile", icon: User, component: ProfileTab },
  { id: "security", label: "Security", icon: Shield, component: SecurityTab },
  {
    id: "preferences",
    label: "Preferences",
    icon: Settings,
    component: PreferencesTab,
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: Crown,
    component: SubscriptionTab,
  },
  { id: "history", label: "History", icon: History, component: HistoryTab },
];

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { currentSubscription } = useSubscription();

  const [activeTab, setActiveTab] = useState("profile");

  // Initialize from URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderActiveTab = () => {
    const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
    if (activeTabConfig) {
      const Component = activeTabConfig.component;
      return <Component />;
    }
    return <ProfileTab />;
  };

  return (
    <div className="account-page">
      {/* Animated Background */}
      <div className="account-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="container">
        <div className="account-container">
          {/* Header */}
          <div className="account-header">
            <div className="header-icon glass-primary">
              <UserCircle size={32} />
            </div>
            <h1 className="account-title">Account Settings</h1>
            <p className="account-subtitle">
              Manage your profile, preferences, and subscription
            </p>

            {/* User Info Summary */}
            <div className="user-summary glass">
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
                <h3 className="user-name">{user?.username || "User"}</h3>
                <p className="user-email">{user?.email}</p>
                {currentSubscription && (
                  <span className={`plan-badge ${currentSubscription.tier}`}>
                    {currentSubscription.tier === "free"
                      ? "Free Plan"
                      : "Premium Plan"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="account-content">
            {/* Sidebar Navigation */}
            <aside className="account-sidebar glass">
              <nav className="sidebar-nav">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`nav-tab ${isActive ? "active" : ""}`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="account-main glass">{renderActiveTab()}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
