import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import SignInPage from "./pages/SignInPage/SignInPage";
import AccountPage from "./pages/AccountPage/AccountPage";
import QuestionsPage from "./pages/QuestionsPage/QuestionsPage";
import SubscriptionPage from "./pages/SubscriptionPage/SubscriptionPage";
import Navbar from "./components/layout/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route 
          path="/account/*" 
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subscription" 
          element={<SubscriptionPage />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
