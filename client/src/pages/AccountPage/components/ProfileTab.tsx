import React, { useState, useEffect, useRef } from "react";
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
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Messages } from "primereact/messages";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./AccountComponents.css";

interface ProfileData {
  username: string;
  age: string;
}

const ProfileTab: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    age: "",
  });

  const messagesRef = useRef<any>(null);

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
    messagesRef.current?.clear();
  };

  const validateForm = (): boolean => {
    if (profileData.username.trim().length < 3) {
      messagesRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Username must be at least 3 characters long",
      });
      return false;
    }

    const ageNum = parseInt(profileData.age);
    if (profileData.age && (ageNum < 13 || ageNum > 120)) {
      messagesRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Age must be between 13 and 120",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      messagesRef.current?.clear();

      await api.updateCurrentUser({
        username: profileData.username.trim(),
        age: profileData.age ? parseInt(profileData.age) : null,
      });

      await refreshUser();
      setIsEditing(false);

      messagesRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Profile updated successfully!",
      });
    } catch (error) {
      messagesRef.current?.show({
        severity: "error",
        summary: "Update Failed",
        detail:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    messagesRef.current?.clear();

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
          <Button
            icon={<Edit size={16} />}
            label="Edit Profile"
            onClick={() => setIsEditing(true)}
            severity="secondary"
            className="p-button-secondary"
          />
        )}
      </div>

      {/* Messages */}
      <Messages ref={messagesRef} />

      {/* Form Content */}
      <div className="p-fluid">
        <div className="p-formgrid">
          {/* Email (Read-only) */}
          <div className="p-field p-col-12">
            <label htmlFor="email">
              <Mail size={16} />
              Email Address
            </label>
            <InputText id="email" value={user?.email || ""} disabled readOnly />
            <small>Email cannot be changed for security reasons</small>
          </div>

          {/* Username */}
          <div className="p-field p-col-12">
            <label htmlFor="username">
              <User size={16} />
              Username (Optional)
            </label>
            {isEditing ? (
              <InputText
                id="username"
                value={profileData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter your username"
                maxLength={50}
                disabled={isLoading}
              />
            ) : (
              <InputText
                value={profileData.username || "No username set"}
                readOnly
              />
            )}
          </div>

          {/* Age (Optional) */}
          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="age">
              <Calendar size={16} />
              Age
            </label>
            {isEditing ? (
              <InputNumber
                inputId="age"
                value={profileData.age ? parseInt(profileData.age) : null}
                onValueChange={(e) =>
                  handleInputChange("age", e.value ? e.value.toString() : "")
                }
                placeholder="Enter your age"
                min={13}
                max={120}
                disabled={isLoading}
                showButtons
                buttonLayout="stacked"
              />
            ) : (
              <InputText
                value={profileData.age || "Not specified"}
                readOnly
                style={{ maxWidth: "200px" }}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="p-d-flex p-ai-center p-mt-3" style={{ gap: "1rem" }}>
            <Button
              icon={
                isLoading ? (
                  <Loader2 size={16} className="loading-spinner" />
                ) : (
                  <Save size={16} />
                )
              }
              label={isLoading ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              disabled={isLoading}
              className="p-button-primary"
            />
            <Button
              icon={<X size={16} />}
              label="Cancel"
              onClick={handleCancel}
              disabled={isLoading}
              className="p-button-secondary"
            />
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="account-info-card">
        <h3>Account Information</h3>
        <div className="info-row">
          <span className="info-label">Account Created:</span>
          <span className="info-value">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "Unknown"}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Account Status:</span>
          <span
            className={`info-value ${user?.is_active ? "active" : "inactive"}`}
          >
            {user?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Email Verified:</span>
          <span
            className={`info-value ${user?.is_verified ? "active" : "inactive"}`}
          >
            {user?.is_verified ? "Verified" : "Not Verified"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
