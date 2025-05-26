import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Film,
  Book,
  Star,
  ArrowRight,
  Users,
  Zap,
  Crown,
  Check,
  PlayCircle,
  ChevronDown,
  TrendingUp,
  Shield,
  Globe,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getMaxQuestions } = useSubscription();

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/questions");
    } else {
      navigate("/signup");
    }
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo video modal
    console.log("Play demo video");
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const stats = [
    { label: "Happy Users", value: "10,000+", icon: Users },
    { label: "Recommendations", value: "50,000+", icon: TrendingUp },
    { label: "Movies & Books", value: "1M+", icon: Star },
    { label: "Success Rate", value: "98%", icon: Check },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Intelligence",
      description:
        "Our advanced AI analyzes your preferences to deliver perfectly tailored recommendations.",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      icon: Zap,
      title: "Lightning Fast Results",
      description:
        "Get personalized recommendations in seconds, not hours. Our AI works at the speed of thought.",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your data is secure and private. We never share your preferences with third parties.",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      icon: Globe,
      title: "Global Content",
      description:
        "Access recommendations from a vast library of movies and books from around the world.",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Book Lover",
      avatar: "SJ",
      content:
        "SmartAdvisor found me my new favorite series! The recommendations are spot-on and introduced me to genres I never thought I'd enjoy.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Movie Enthusiast",
      avatar: "MC",
      content:
        "I've discovered more great movies in the past month than I had in the previous year. The AI really understands my taste!",
      rating: 5,
    },
    {
      name: "Emma Davis",
      role: "Avid Reader",
      avatar: "ED",
      content:
        "The book recommendations are incredible. It's like having a personal librarian who knows exactly what I want to read next.",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: 0,
      interval: "forever",
      description: "Perfect for getting started",
      features: [
        "5 questions per recommendation",
        "Basic movie and book suggestions",
        "Standard AI recommendations",
        "Email support",
      ],
      buttonText: "Get Started Free",
      popular: false,
    },
    {
      name: "Premium",
      price: 4.99,
      interval: "month",
      description: "Best for recommendation enthusiasts",
      features: [
        "15 questions per recommendation",
        "Enhanced AI analysis",
        "Premium content access",
        "Unlimited recommendation history",
        "Priority support",
        "Early access to new features",
      ],
      buttonText: "Start Premium",
      popular: true,
    },
  ];

  return (
    <div className="home-page">
      {/* Animated Background */}
      <div className="home-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>AI-Powered Recommendations</span>
              </div>

              <h1 className="hero-title">
                Discover Your Next
                <span className="gradient-text"> Favorite </span>
                Movie or Book
              </h1>

              <p className="hero-description">
                Get personalized recommendations powered by advanced AI. Answer
                a few questions and discover amazing content tailored just for
                you.
              </p>

              <div className="hero-actions">
                <button
                  onClick={handleGetStarted}
                  className="btn-primary hero-cta"
                >
                  <Sparkles size={20} />
                  {isAuthenticated ? "Get Recommendations" : "Start Free Today"}
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={handleWatchDemo}
                  className="btn-glass demo-btn"
                >
                  <PlayCircle size={20} />
                  Watch Demo
                </button>
              </div>

              {isAuthenticated && (
                <div className="user-welcome">
                  <div className="welcome-message">
                    <span>Welcome back, {user?.username || "there"}!</span>
                    <span className="question-count">
                      Ready for up to {getMaxQuestions()} personalized
                      questions?
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="hero-visual">
              <div className="hero-cards">
                <div className="recommendation-card movie-card">
                  <div className="card-icon">
                    <Film size={32} />
                  </div>
                  <h3>Movies</h3>
                  <p>Cinematic masterpieces</p>
                  <div className="card-accent"></div>
                </div>

                <div className="recommendation-card book-card">
                  <div className="card-icon">
                    <Book size={32} />
                  </div>
                  <h3>Books</h3>
                  <p>Literary adventures</p>
                  <div className="card-accent"></div>
                </div>

                <div className="recommendation-card both-card">
                  <div className="card-icon">
                    <Star size={32} />
                  </div>
                  <h3>Both</h3>
                  <p>Complete experience</p>
                  <div className="card-accent"></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => scrollToSection("features")}
            className="scroll-indicator"
            aria-label="Scroll to features"
          >
            <ChevronDown size={24} />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-card glass">
                  <div className="stat-icon">
                    <Icon size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose SmartAdvisor?</h2>
            <p className="section-description">
              Powered by cutting-edge AI technology to deliver the most accurate
              and personalized recommendations you'll ever receive.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card glass">
                  <div
                    className="feature-icon"
                    style={{ background: feature.gradient }}
                  >
                    <Icon size={28} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Get personalized recommendations in three simple steps
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card glass">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Choose Your Interest</h3>
                <p>
                  Select whether you want movie recommendations, book
                  suggestions, or both.
                </p>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-card glass">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Answer Questions</h3>
                <p>
                  Our AI asks you {getMaxQuestions()} personalized questions
                  about your preferences.
                </p>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-card glass">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Recommendations</h3>
                <p>
                  Receive curated suggestions tailored perfectly to your taste
                  and interests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-description">
              Join thousands of satisfied users who've discovered their new
              favorites
            </p>
          </div>

          <div className="testimonials-container">
            <div className="testimonial-card glass">
              <div className="testimonial-content">
                <div className="stars">
                  {[...Array(testimonials[currentTestimonial].rating)].map(
                    (_, i) => (
                      <Star key={i} size={16} className="star-filled" />
                    ),
                  )}
                </div>
                <blockquote className="testimonial-text">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="author-role">
                      {testimonials[currentTestimonial].role}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-indicators">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentTestimonial ? "active" : ""}`}
                  onClick={() => setCurrentTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Choose Your Plan</h2>
            <p className="section-description">
              Start free and upgrade when you're ready for more features
            </p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card glass ${plan.popular ? "featured" : ""}`}
              >
                {plan.popular && (
                  <div className="popular-badge">
                    <Crown size={16} />
                    Most Popular
                  </div>
                )}

                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="interval">/{plan.interval}</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-features">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="feature-item">
                      <Check size={16} className="feature-check" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    plan.name === "Free"
                      ? handleGetStarted()
                      : navigate("/subscription")
                  }
                  className={`plan-button ${plan.popular ? "btn-primary" : "btn-outline"}`}
                >
                  {isAuthenticated && plan.name === "Free"
                    ? "Get Recommendations"
                    : plan.buttonText}
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content glass">
            <div className="cta-text">
              <h2 className="cta-title">
                Ready to Discover Your Next Favorite?
              </h2>
              <p className="cta-description">
                Join thousands of users who've found their perfect
                recommendations. Start your personalized journey today.
              </p>
            </div>
            <div className="cta-actions">
              <button
                onClick={handleGetStarted}
                className="btn-primary cta-button"
              >
                <Sparkles size={20} />
                {isAuthenticated ? "Get Recommendations" : "Start Free Now"}
                <ArrowRight size={20} />
              </button>
              {!isAuthenticated && (
                <p className="cta-note">
                  No credit card required • Free forever plan available
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;