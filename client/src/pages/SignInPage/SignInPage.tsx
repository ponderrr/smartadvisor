import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import styles from "./SignInPage.module.css";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = {
      email: "",
      password: "",
    };

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);

    // If there are validation errors, don't proceed
    if (errors.email || errors.password) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(formData.email, formData.password);
      navigate("/questions");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles["signin-page"]}>
      <div className={styles["signin-container"]}>
        <div className={styles["signin-content"]}>
          {/* Left Side - Branding */}
          <div className={styles["signin-branding"]}>
            <div className={styles["branding-content"]}>
              <h1 className={styles["branding-title"]}>
                Welcome Back to Your
                <span className={styles["gradient-text"]}>
                  {" "}
                  Smart Recommendations
                </span>
              </h1>

              <p className={styles["branding-description"]}>
                Continue your journey of discovering amazing content tailored
                just for you. Your personalized recommendations are waiting.
              </p>

              <div className={styles["feature-highlights"]}>
                <div className={styles["highlight-item"]}>
                  <div className={styles["highlight-icon"]}>
                    <Shield size={20} />
                  </div>
                  <span>Secure & Private</span>
                </div>
                <div className={styles["highlight-item"]}>
                  <div className={styles["highlight-icon"]}>
                    <ArrowRight size={20} />
                  </div>
                  <span>Quick Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className={styles["signin-form-section"]}>
            <Card className={styles["signin-form-card"]}>
              <div className={styles["form-header"]}>
                <h2 className={styles["form-title"]}>Sign In</h2>
                <p className={styles["form-description"]}>
                  Enter your credentials to access your account
                </p>
              </div>

              {error && (
                <Message
                  severity="error"
                  className={styles["signin-error"]}
                  text={error}
                />
              )}

              <form onSubmit={handleSubmit} className={styles["signin-form"]}>
                <div className={styles["input-group"]}>
                  <label htmlFor="email" className={styles["input-label"]}>
                    Email Address
                  </label>
                  <div className={styles["input-wrapper"]}>
                    <Mail className={styles["input-icon"]} size={20} />
                    <InputText
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`${styles["signin-input"]} ${validationErrors.email ? "p-invalid" : ""}`}
                      required
                    />
                    {validationErrors.email && (
                      <Message
                        severity="error"
                        text={validationErrors.email}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <div className={styles["input-group"]}>
                  <label htmlFor="password" className={styles["input-label"]}>
                    Password
                  </label>
                  <div className={styles["input-wrapper"]}>
                    <Lock className={styles["input-icon"]} size={20} />
                    <InputText
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`${styles["signin-input"]} ${validationErrors.password ? "p-invalid" : ""}`}
                      required
                    />
                    {validationErrors.password && (
                      <Message
                        severity="error"
                        text={validationErrors.password}
                        className="mt-2"
                      />
                    )}
                    <button
                      type="button"
                      className={styles["password-toggle"]}
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className={styles["form-options"]}>
                  <Link
                    to="/forgot-password"
                    className={styles["forgot-password"]}
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  label={loading ? "Signing In..." : "Sign In"}
                  icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                  loading={loading}
                  className={styles["signin-button"]}
                />

                <div className={styles["form-footer"]}>
                  <p className={styles["signup-prompt"]}>
                    Don't have an account?{" "}
                    <Link to="/signup" className={styles["signup-link"]}>
                      Sign up here
                    </Link>
                  </p>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
