import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";

import "./AccountComponents.css";

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SecurityTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (field: keyof SecurityData, value: string) => {
    setSecurityData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    if (!securityData.currentPassword) {
      setError("Current password is required");
      return false;
    }

    if (securityData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(securityData.newPassword)) {
      setError(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
      return false;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError("New passwords do not match");
      return false;
    }

    if (securityData.currentPassword === securityData.newPassword) {
      setError("New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement password change API call
      // await api.changePassword(securityData.currentPassword, securityData.newPassword);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string,
  ): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const strength = [
      { label: "Very Weak", color: "#ef4444" },
      { label: "Weak", color: "#f97316" },
      { label: "Fair", color: "#eab308" },
      { label: "Good", color: "#22c55e" },
      { label: "Strong", color: "#10b981" },
    ];

    return { score, ...strength[Math.min(score, 4)] };
  };

  const passwordStrength = getPasswordStrength(securityData.newPassword);

  return (
    <div className="form-section">
      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">Security Settings</h2>
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

      {/* Change Password Form */}
      <div className="security-card">
        <h3 className="security-card-title">
          <Lock size={20} />
          Change Password
        </h3>

        <div className="form-grid">
          {/* Current Password */}
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                className="form-input"
                placeholder="Enter your current password"
                disabled={isLoading}

              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="input-icon"
                disabled={isLoading}
              >
                {showPasswords.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={securityData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                className="form-input"
                placeholder="Enter your new password"
                disabled={isLoading}
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="input-icon"
                disabled={isLoading}
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {securityData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-indicator"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={securityData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className="form-input"
                placeholder="Confirm your new password"
                disabled={isLoading}
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="input-icon"
                disabled={isLoading}
              >
                {showPasswords.confirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="form-actions">
            <button
              onClick={handleChangePassword}
              disabled={
                isLoading ||
                !securityData.currentPassword ||
                !securityData.newPassword ||
                !securityData.confirmPassword
              }
              className="btn-save"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="security-tips">
        <h3 className="security-tips-title">
          <Shield size={20} />
          Security Tips
        </h3>
        <ul className="security-tips-list">
          <li>
            ✓ Use a password that's at least 8 characters long
          </li>
          <li>
            ✓ Include uppercase and lowercase letters, numbers, and symbols
          </li>
          <li style={{ marginBottom: "var(--space-2)" }}>
            ✓ Don't use personal information or common words
          </li>
          <li style={{ marginBottom: "var(--space-2)" }}>
            ✓ Use a unique password that you don't use elsewhere
          </li>
          <li>
            ✓ Consider using a password manager to generate and store secure
            passwords
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SecurityTab;
