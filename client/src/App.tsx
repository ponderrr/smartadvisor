import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RecommendationProvider } from "./context/RecommendationContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { SavedItemsProvider } from "./context/SavedItemsContext"; // Add this import
import { clearInvalidTokens } from "./utils/tokenCleanup";
import TokenDebug from "./components/debug/TokenDebug";

// Import the new glassmorphism pages
import HomePage from "./pages/HomePage/HomePage";
import SignInPage from "./pages/SignInPage/SignInPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import AccountPage from "./pages/AccountPage/AccountPage";
import QuestionsPage from "./pages/QuestionsPage/QuestionsPage";
import RecommendationsResults from "./pages/RecommendationsResults/RecommendationsResults";
import SubscriptionPage from "./pages/SubscriptionPage/SubscriptionPage";
import Navbar from "./components/layout/Navbar/Navbar";

// Enhanced Loading Component
const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="loading-container">
      <div className="loading-spinner-large"></div>
      <h2 className="loading-text">SmartAdvisor</h2>
      <p className="loading-subtitle">Preparing your experience...</p>
    </div>
  </div>
);

// Protected Route wrapper with enhanced UX
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Main App Routes Component
function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />

          {/* Auth Routes - redirect to home if already authenticated */}
          <Route
            path="/signin"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignInPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignUpPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - require authentication */}
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <QuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations/results"
            element={
              <ProtectedRoute>
                <RecommendationsResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations/:recommendationId"
            element={
              <ProtectedRoute>
                <RecommendationsResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/*"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          {/* Semi-Protected Routes - enhanced with auth but accessible without */}
          <Route path="/subscription" element={<SubscriptionPage />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Main App Component
function App() {
  // Clean up invalid tokens before starting the app
  React.useEffect(() => {
    console.log("🚀 Starting SmartAdvisor...");
    clearInvalidTokens();
  }, []);

  // Set up theme detection
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <SavedItemsProvider>
            <RecommendationProvider>
              <AppRoutes />
              <TokenDebug />
            </RecommendationProvider>
          </SavedItemsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
