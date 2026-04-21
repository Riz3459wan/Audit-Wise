import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Landing = lazy(() => import("./pages/Landing"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Reports = lazy(() => import("./pages/Reports"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const PaymentConfirmation = lazy(() => import("./pages/PaymentConfirmation"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));

import { tabSession } from "./utils/tabSession";

const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <CircularProgress />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(tabSession.isActive());
    };
    checkAuth();
  }, []);

  if (isAuth === null) {
    return <LoadingFallback />;
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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/paymentConfirmation"
            element={<PaymentConfirmation />}
          />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
