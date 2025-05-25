import React, { useState, useEffect } from "react";
import {
  Edit,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";

interface ProfileData {
  username: string;
  age: string;
}

const ProfileTab: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    age: "",
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        age: user.age?.toString() || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (profileData.username.trim().length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }

    if (
      profileData.age &&
      (parseInt(profileData.age) < 13 || parseInt(profileData.age) > 120)
    ) {
      setError("Age must be between 13 and 120");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.updateCurrentUser({
        username: profileData.username.trim(),
        age: profileData.age ? parseInt(profileData.age) : null,
      });

      await refreshUser();
      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data
    if (user) {
      setProfileData({
        username: user.username || "",
        age: user.age?.toString() || "",
      });
    }
  };

  return (
    <div className="form-section">
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Profile Information</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-edit">
            <Edit size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="alert success">
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div className="alert error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Form Grid */}
      <div className="form-grid">
        {/* Email (Read-only) */}
        <div className="form-group">
          <label className="form-label">
            <Mail
              size={16}
              style={{ display: "inline", marginRight: "0.5rem" }}
            />
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ""}
            className="form-input readonly"
            readOnly
            disabled
          />
          <small
            style={{ color: "var(--neutral-500)", fontSize: "var(--text-sm)" }}
          >
            Email cannot be changed for security reasons
          </small>
        </div>

        {/* Username */}
        <div className="form-group">
          <label className="form-label">
            <User
              size={16}
              style={{ display: "inline", marginRight: "0.5rem" }}
            />
            Username
          </label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="form-input"
              placeholder="Enter your username"
              disabled={isLoading}
              maxLength={50}
            />
          ) : (
            <input
              type="text"
              value={profileData.username || "No username set"}
              className="form-input readonly"
              readOnly
            />
          )}
        </div>

        {/* Age */}
        <div className="form-group">
          <label className="form-label">
            <Calendar
              size={16}
              style={{ display: "inline", marginRight: "0.5rem" }}
            />
            Age (Optional)
          </label>
          {isEditing ? (
            <input
              type="number"
              value={profileData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              className="form-input"
              placeholder="Enter your age"
              disabled={isLoading}
              min="13"
              max="120"
              style={{ maxWidth: "200px" }}
            />
          ) : (
            <input
              type="text"
              value={profileData.age || "Not specified"}
              className="form-input readonly"
              readOnly
              style={{ maxWidth: "200px" }}
            />
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--glass-white)",
            }}
          >
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-save"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="btn-edit"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div
        style={{
          marginTop: "var(--space-8)",
          padding: "var(--space-6)",
          background: "var(--glass-white)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--neutral-800)",
            marginBottom: "var(--space-4)",
          }}
        >
          Account Information
        </h3>
        <div
          style={{
            display: "grid",
            gap: "var(--space-3)",
            fontSize: "var(--text-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--neutral-600)" }}>
              Account Created:
            </span>
            <span style={{ color: "var(--neutral-800)" }}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--neutral-600)" }}>Account Status:</span>
            <span
              style={{
                color: user?.is_active ? "var(--primary-500)" : "#ef4444",
                fontWeight: "var(--weight-medium)",
              }}
            >
              {user?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--neutral-600)" }}>Email Verified:</span>
            <span
              style={{
                color: user?.is_verified ? "var(--primary-500)" : "#ef4444",
                fontWeight: "var(--weight-medium)",
              }}
            >
              {user?.is_verified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
