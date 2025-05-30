import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";
import styles from "./SignUpPage.module.css";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: "",
    };

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!agreeToTerms) {
      errors.terms = "You must agree to the terms and conditions";
    }

    setValidationErrors(errors);

    // If there are validation errors, don't proceed
    if (Object.values(errors).some((error) => error)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
      );
      navigate("/questions");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className={styles["signup-page"]}>
      <div className={styles["signup-container"]}>
        <div className={styles["signup-content"]}>
          {/* Left Side - Branding */}
          <div className={styles["signup-branding"]}>
            <div className={styles["branding-content"]}>
              <h1 className={styles["branding-title"]}>
                Join Thousands of Users Getting
                <span className={styles["gradient-text"]}>
                  {" "}
                  Personalized Recommendations
                </span>
              </h1>

              <p className={styles["branding-description"]}>
                Create your account and unlock a world of content tailored
                specifically to your interests. Start your personalized journey
                today.
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
                    <Star size={20} />
                  </div>
                  <span>Personalized Experience</span>
                </div>
                <div className={styles["highlight-item"]}>
                  <div className={styles["highlight-icon"]}>
                    <ArrowRight size={20} />
                  </div>
                  <span>Quick Setup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className={styles["signup-form-section"]}>
            <Card className={styles["signup-form-card"]}>
              <div className={styles["form-header"]}>
                <h2 className={styles["form-title"]}>Create Account</h2>
                <p className={styles["form-description"]}>
                  Fill in your details to get started
                </p>
              </div>

              {error && (
                <Message
                  severity="error"
                  className={styles["signup-error"]}
                  text={error}
                />
              )}

              <form onSubmit={handleSubmit} className={styles["signup-form"]}>
                <div className={styles["name-row"]}>
                  <div className={styles["input-group"]}>
                    <label
                      htmlFor="firstName"
                      className={styles["input-label"]}
                    >
                      First Name
                    </label>
                    <div className={styles["input-wrapper"]}>
                      <User className={styles["input-icon"]} size={20} />
                      <InputText
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className={`${styles["signup-input"]} ${validationErrors.firstName ? "p-invalid" : ""}`}
                        required
                      />
                    </div>
                    {validationErrors.firstName && (
                      <Message
                        severity="error"
                        text={validationErrors.firstName}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className={styles["input-group"]}>
                    <label htmlFor="lastName" className={styles["input-label"]}>
                      Last Name
                    </label>
                    <div className={styles["input-wrapper"]}>
                      <User className={styles["input-icon"]} size={20} />
                      <InputText
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className={`${styles["signup-input"]} ${validationErrors.lastName ? "p-invalid" : ""}`}
                        required
                      />
                    </div>
                    {validationErrors.lastName && (
                      <Message
                        severity="error"
                        text={validationErrors.lastName}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

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
                      className={`${styles["signup-input"]} ${validationErrors.email ? "p-invalid" : ""}`}
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <Message
                      severity="error"
                      text={validationErrors.email}
                      className="mt-2"
                    />
                  )}
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
                      placeholder="Create a strong password"
                      className={`${styles["signup-input"]} ${validationErrors.password ? "p-invalid" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles["password-toggle"]}
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <Message
                      severity="error"
                      text={validationErrors.password}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className={styles["input-group"]}>
                  <label
                    htmlFor="confirmPassword"
                    className={styles["input-label"]}
                  >
                    Confirm Password
                  </label>
                  <div className={styles["input-wrapper"]}>
                    <Lock className={styles["input-icon"]} size={20} />
                    <InputText
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`${styles["signup-input"]} ${validationErrors.confirmPassword ? "p-invalid" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles["password-toggle"]}
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <Message
                      severity="error"
                      text={validationErrors.confirmPassword}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className={styles["checkbox-group"]}>
                  <div className={styles["checkbox-wrapper"]}>
                    <Checkbox
                      inputId="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => {
                        setAgreeToTerms(e.checked);
                        if (validationErrors.terms) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            terms: "",
                          }));
                        }
                      }}
                      className={validationErrors.terms ? "p-invalid" : ""}
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className={styles["checkbox-label"]}
                    >
                      I agree to the{" "}
                      <Link to="/terms" className={styles["terms-link"]}>
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className={styles["terms-link"]}>
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {validationErrors.terms && (
                    <Message
                      severity="error"
                      text={validationErrors.terms}
                      className="mt-2"
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  label={loading ? "Creating Account..." : "Create Account"}
                  icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
                  loading={loading}
                  className={styles["signup-button"]}
                />

                <div className={styles["form-footer"]}>
                  <p className={styles["signin-prompt"]}>
                    Already have an account?{" "}
                    <Link to="/signin" className={styles["signin-link"]}>
                      Sign in here
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

export default SignUpPage;
