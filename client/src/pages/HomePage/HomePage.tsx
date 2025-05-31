import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  Book,
  Star,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Ripple } from "primereact/ripple";
import { ScrollTop } from "primereact/scrolltop";
import { classNames } from "primereact/utils";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { getMaxQuestions } = useSubscription();
  const [showScrollDown, setShowScrollDown] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollDown(window.scrollY < 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/questions");
    } else {
      navigate("/signup");
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for any fixed headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const features = [
    {
      icon: Star,
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
              <h1 className="hero-title">
                <span className="text-primary">Smart. </span>
                Better Recommendations
                <span className="text-primary"> For You.</span>
              </h1>

              <p className="hero-description">
                Get personalized recommendations powered by advanced AI. Answer
                a few questions and discover amazing content tailored just for
                you.
              </p>

              <div className="hero-actions">
                <Button
                  onClick={handleGetStarted}
                  className="hero-cta-button p-ripple"
                  rounded
                  iconPos="right"
                  label={
                    isAuthenticated
                      ? "Get Recommendations"
                      : "Get Started Today"
                  }
                >
                  <Ripple />
                </Button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-cards">
                {/* Ripple on Card clicks */}
                <Card className="recommendation-card movie-card p-ripple">
                  <div className="card-icon">
                    <Film size={32} />
                  </div>
                  <h3>Movies</h3>
                  <p>Cinematic masterpieces</p>
                  <div className="card-accent"></div>
                  <Ripple />
                </Card>

                <Card className="recommendation-card book-card p-ripple">
                  <div className="card-icon">
                    <Book size={32} />
                  </div>
                  <h3>Books</h3>
                  <p>Literary adventures</p>
                  <div className="card-accent"></div>
                  <Ripple />
                </Card>

                <Card className="recommendation-card both-card p-ripple">
                  <div className="card-icon">
                    <Star size={32} />
                  </div>
                  <h3>Both</h3>
                  <p>Complete experience</p>
                  <div className="card-accent"></div>
                  <Ripple />
                </Card>
              </div>
            </div>
          </div>

          {/* Scroll Down Indicator using PrimeReact pattern */}
          <div
            className={`scroll-down-indicator ${showScrollDown ? "visible" : ""}`}
            onClick={() => scrollToSection("features")}
            aria-label="Scroll to features"
          >
            <i
              className="pi pi-angle-down fadeout animation-duration-1000 animation-iteration-infinite"
              style={{ fontSize: "2rem", color: "white" }}
            ></i>
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
                <Card key={index} className="feature-card glass p-ripple">
                  <div className={`feature-icon gradient-bg-${index + 1}`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <Ripple />
                </Card>
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

          <div className="steps-grid">
            <Card className="step-card glass p-ripple">
              <div className="step-icon gradient-bg-1">
                <span className="step-number">1</span>
              </div>
              <h3 className="step-title">Choose Your Interest</h3>
              <p className="step-description">
                Select whether you want movie recommendations, book suggestions,
                or both.
              </p>
              <Ripple />
            </Card>

            <Card className="step-card glass p-ripple">
              <div className="step-icon gradient-bg-2">
                <span className="step-number">2</span>
              </div>
              <h3 className="step-title">Answer Questions</h3>
              <p className="step-description">
                Our AI asks you {getMaxQuestions()} personalized questions about
                your preferences.
              </p>
              <Ripple />
            </Card>

            <Card className="step-card glass p-ripple">
              <div className="step-icon gradient-bg-3">
                <span className="step-number">3</span>
              </div>
              <h3 className="step-title">Get Recommendations</h3>
              <p className="step-description">
                Receive curated suggestions tailored perfectly to your taste and
                interests.
              </p>
              <Ripple />
            </Card>
          </div>
        </div>
      </section>

      {/* PrimeReact ScrollTop Component */}
      <ScrollTop 
        className="custom-scrolltop" 
        target="window"
        threshold={100}
        behavior="smooth"
        icon="pi pi-arrow-up"
      />
    </div>
  );
};

export default HomePage;
