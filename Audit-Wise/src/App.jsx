import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import TrialUpload from "./pages/TrialUpload";
import Uploads from "./pages/Uploads";
import Reports from "./pages/Reports";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import { tabSession } from "./utils/tabSession";
import Layout from "./components/layout/Layout";

const PrivateRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(tabSession.isActive());
    };
    checkAuth();
    const interval = setInterval(() => {
      if (tabSession.isActive()) {
        tabSession.updateLastActive();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isAuth === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #6366f1, #38bdf8)",
        }}
      >
        <div style={{ color: "white", fontSize: "1.2rem" }}>Loading...</div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/" replace />;
};

const ProtectedLayout = () => {
  return (
    <PrivateRoute>
      <Layout />
    </PrivateRoute>
  );
};

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/trial-upload" element={<TrialUpload />} />
        <Route path="/paymentConfirmation" element={<PaymentConfirmation />} />
        <Route path="/paymentSuccess" element={<PaymentSuccess />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Uploads />} />
          <Route path="/report" element={<Reports />} />
          <Route path="/price" element={<Pricing />} />
          <Route path="/setting" element={<Settings />} />
          <Route path="/profileSetting" element={<ProfileSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
