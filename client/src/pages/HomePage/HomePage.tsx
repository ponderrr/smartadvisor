import React, { useState, useEffect } from "react";
import { MessageCircle, Users } from "lucide-react";

// Import Lobe Hub icons
import { OpenAI, Anthropic, Gemini } from "@lobehub/icons";

import "./HomePage.css";

const HomePage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  return (
    <div className="app">
      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="hero-section">
            {/* Left Side - Main Content */}
            <div className="hero-content">
              <h1 className="hero-title">
                Discover Your Next
                <br />
                Favorite Movie or Book
              </h1>
              <p className="hero-description">
                <span className="brand-highlight">Smart Advisor</span> uses AI
                to recommend what you'll love—instantly.
              </p>
              <div className="hero-actions">
                <button className="primary-button">Get Recommendations</button>
                <button className="secondary-button">Learn More</button>
              </div>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="chat-interface">
              <div className="chat-header">
                <div className="chat-logo">
                  {/* Use OpenAI icon for chat */}
                  <OpenAI size={20} />
                </div>
                <span className="chat-title">SmartAdvisor</span>
              </div>

              <div className="chat-messages">
                <div className="user-message">
                  <p>What should I read if I love mystery novels?</p>
                </div>

                <div className="bot-message-container">
                  <div className="bot-avatar">
                    {/* Use Gemini icon for bot avatar */}
                    <Gemini size={16} />
                  </div>
                  <div className="bot-message">
                    <p>Try Strangers of This More Summer</p>
                  </div>
                </div>
              </div>

              <div className="chat-input-container">
                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Ask for a recommendation..."
                    className="input-field"
                  />
                  <button className="send-button">
                    <MessageCircle className="send-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section with AI Provider Icons */}
          <div className="features-section">
            <div className="feature-card card-hover">
              <div className="feature-icon green">
                {/* Use Gemini icon */}
                <Gemini size={32} />
              </div>
              <h3 className="feature-title">AI-Powered Suggestions</h3>
              <p className="feature-description">
                Get personalized picks based on what you enjoy.
              </p>
            </div>

            <div className="feature-card card-hover">
              <div className="feature-icon orange">
                {/* Use Anthropic icon */}
                <Anthropic size={32} />
              </div>
              <h3 className="feature-title">Instant Answers</h3>
              <p className="feature-description">
                Ask anything—from genres to specific recommendations.
              </p>
            </div>

            <div className="feature-card card-hover">
              <div className="feature-icon purple">
                {/* Use OpenAI icon */}
                <OpenAI size={32} />
              </div>
              <h3 className="feature-title">Universal Access</h3>
              <p className="feature-description">
                Works for everyone, anywhere—no app or account required.
              </p>
            </div>
          </div>

          {/* AI Models Showcase Section */}
          <div className="ai-models-showcase">
            <h2 className="section-title">Powered by Leading AI Models</h2>
            <p className="section-description">
              SmartAdvisor leverages the most advanced AI models to deliver
              exceptional recommendations.
            </p>

            <div className="models-grid">
              <div className="model-card openai-card">
                <div className="model-icon">
                  <OpenAI size={56} />
                </div>
                <h3 className="model-name">OpenAI</h3>
                <p className="model-description">
                  Sophisticated language processing with GPT models
                </p>
              </div>

              <div className="model-card anthropic-card">
                <div className="model-icon">
                  <Anthropic size={56} />
                </div>
                <h3 className="model-name">Anthropic</h3>
                <p className="model-description">
                  Claude models for nuanced understanding and safety
                </p>
              </div>

              <div className="model-card gemini-card">
                <div className="model-icon">
                  <Gemini size={56} />
                </div>
                <h3 className="model-name">Gemini</h3>
                <p className="model-description">
                  Google's multimodal models with advanced capabilities
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="how-it-works">
            <h2 className="section-title">How It Works</h2>

            <div className="steps-grid">
              <div className="step-card card-hover">
                <div className="step-icon green">
                  <Users className="icon" />
                </div>
                <h3 className="step-title">Ask SmartAdvisor</h3>
                <p className="step-description">
                  Share your interests, favorite genres, or specific requests.
                </p>
              </div>

              <div className="step-card card-hover">
                <div className="step-icon orange">
                  {/* Use Anthropic icon */}
                  <Anthropic size={32} />
                </div>
                <h3 className="step-title">Get Intelligent Responses</h3>
                <p className="step-description">
                  Receive smart, tailored recommendations instantly.
                </p>
              </div>

              <div className="step-card card-hover">
                <div className="step-icon purple">
                  {/* Use Gemini icon */}
                  <Gemini size={32} />
                </div>
                <h3 className="step-title">Explore Suggestions</h3>
                <p className="step-description">
                  Browse curated ideas and discover new favorites.
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="coming-soon-section">
            <h2 className="section-title">Coming Soon</h2>
            <p className="section-description">
              We're expanding SmartAdvisor to include personalized
              recommendations for your favorite streaming platforms.
            </p>

            <div className="streaming-services-grid">
              <div className="streaming-card card-hover">
                <div className="streaming-logo netflix">
                  <span className="streaming-initial">N</span>
                </div>
                <h3 className="streaming-name">Netflix</h3>
                <p className="streaming-description">
                  Get personalized movie and show recommendations based on your
                  watching history.
                </p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>

              <div className="streaming-card card-hover">
                <div className="streaming-logo disney">
                  <span className="streaming-initial">D+</span>
                </div>
                <h3 className="streaming-name">Disney+</h3>
                <p className="streaming-description">
                  Discover hidden gems from Disney, Marvel, Star Wars and more.
                </p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>

              <div className="streaming-card card-hover">
                <div className="streaming-logo hbo">
                  <span className="streaming-initial">HBO</span>
                </div>
                <h3 className="streaming-name">HBO Max</h3>
                <p className="streaming-description">
                  Find your next favorite series from HBO's premium content
                  library.
                </p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>

              <div className="streaming-card card-hover">
                <div className="streaming-logo prime">
                  <span className="streaming-initial">Prime</span>
                </div>
                <h3 className="streaming-name">Amazon Prime</h3>
                <p className="streaming-description">
                  Navigate Prime Video's vast library with smart, tailored
                  recommendations.
                </p>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="logo-icon">
                <Anthropic size={20} />
              </div>
              <span className="logo-text">SmartAdvisor</span>
              <span className="beta-badge">BETA</span>
            </div>

            <nav className="footer-nav">
              <a href="#" className="footer-link">
                Home
              </a>
              <a href="#" className="footer-link">
                How It Works
              </a>
              <a href="#" className="footer-link">
                Recommendations
              </a>
              <a href="#" className="footer-link">
                FAQ
              </a>
              <a href="#" className="footer-link">
                Contact
              </a>
            </nav>

            <p className="footer-copyright">
              © 2024 SmartAdvisor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
