import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    age: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    age?: string;
    acceptTerms?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Age validation (optional but if provided, must be valid)
    if (
      formData.age &&
      (parseInt(formData.age) < 13 || parseInt(formData.age) > 120)
    ) {
      errors.age = "Age must be between 13 and 120";
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = "You must accept the terms and conditions";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const age = formData.age ? parseInt(formData.age) : undefined;
      await register(formData.email, formData.username, formData.password, age);
      // Navigation is handled by the useEffect above
    } catch (error) {
      // Error is handled by the AuthContext
      console.error("Registration failed:", error);
    }
  };

  // Password strength indicator
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

    return { score, ...strength[score] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="signin-page">
      {/* Animated Background */}
      <div className="signin-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="signin-container" style={{ maxWidth: "520px" }}>
        <div className="signin-content">
          {/* Logo Section */}
          <div className="signin-header">
            <Link to="/" className="logo-link">
              <div className="logo-container">
                <Sparkles className="logo-icon" />
                <span className="logo-text">SmartAdvisor</span>
              </div>
            </Link>
            <h1 className="signin-title">Create Account</h1>
            <p className="signin-subtitle">
              Join thousands of users discovering their next favorite movies and
              books
            </p>
          </div>

          {/* Sign Up Form */}
          <form className="signin-form glass" onSubmit={handleSubmit}>
            {/* Global Error Message */}
            {error && (
              <div className="error-banner animate-slide-up">
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`input ${validationErrors.email ? "input-error" : ""}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <span className="error-text">{validationErrors.email}</span>
              )}
            </div>

            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={`input ${validationErrors.username ? "input-error" : ""}`}
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.username && (
                <span className="error-text">{validationErrors.username}</span>
              )}
            </div>

            {/* Age Field (Optional) */}
            <div className="form-group">
              <label htmlFor="age" className="form-label">
                Age <span className="optional-label">(Optional)</span>
              </label>
              <div className="input-wrapper">
                <Calendar className="input-icon" />
                <input
                  type="number"
                  id="age"
                  name="age"
                  className={`input ${validationErrors.age ? "input-error" : ""}`}
                  placeholder="Your age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  min="13"
                  max="120"
                />
              </div>
              {validationErrors.age && (
                <span className="error-text">{validationErrors.age}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`input ${validationErrors.password ? "input-error" : ""}`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    ></div>
                  </div>
                  <span
                    className="strength-label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}

              {validationErrors.password && (
                <span className="error-text">{validationErrors.password}</span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`input ${validationErrors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="error-text">
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms Acceptance */}
            <div className="form-group">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span className="checkbox-label">
                  I agree to the{" "}
                  <Link to="/terms" className="terms-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="terms-link">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {validationErrors.acceptTerms && (
                <span className="error-text">
                  {validationErrors.acceptTerms}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary signin-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="signin-footer">
            <p className="signup-prompt">
              Already have an account?{" "}
              <Link to="/signin" className="signup-link">
                Sign in
              </Link>
            </p>
          </div>

          {/* Benefits Preview */}
          <div className="features-preview">
            <div className="feature-item">
              <div className="feature-icon glass-primary">
                <CheckCircle size={16} />
              </div>
              <span>100% Free to Start</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon glass-primary">
                <Sparkles size={16} />
              </div>
              <span>Unlimited Recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
