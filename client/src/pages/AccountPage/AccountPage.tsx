import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Settings,
  Crown,
  History,
  Shield,
  UserCircle,
} from "lucide-react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
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
  const { user } = useAuth();
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

      <div className="container">
        <div className="account-container">
          {/* Header */}

          <h1 className="account-title">Account Settings</h1>
          <p className="account-subtitle">
            Manage your profile, preferences, and subscription
          </p>
        </div>

        <div className="account-content">
          {/* Sidebar Navigation */}
          <Card className="account-sidebar surface-card">
            <nav className="sidebar-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <Button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={classNames("nav-tab p-button-text", {
                      active: isActive,
                      "surface-hover": !isActive,
                    })}
                    icon={<Icon size={16} />}
                    label={tab.label}
                  />
                );
              })}
            </nav>
          </Card>

          {/* Main Content */}
          <Card className="account-main surface-card">{renderActiveTab()}</Card>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
