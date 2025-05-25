import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./SignInPage.css";

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email address is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("Sign in data:", { email, password, rememberMe });
      // Handle sign in logic here
    }
  };

  return (
    <div className="page-container sign-in-page">
      <div className="container">
        <div className="sign-in-wrapper">
          <div className="sign-in-card">
            <div className="card-header">
              <h1 className="card-title">Sign In</h1>
              <p className="card-subtitle">
                Welcome back! Sign in to access your recommendations.
              </p>
            </div>

            <form className="sign-in-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${formErrors.email ? "error" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && (
                  <div className="form-error">{formErrors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className={`form-input ${formErrors.password ? "error" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                {formErrors.password && (
                  <div className="form-error">{formErrors.password}</div>
                )}
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me">Remember me</label>
                </div>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn-primary sign-in-button">
                Sign In
              </button>
            </form>

            <div className="sign-in-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/signup" className="signup-link">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;