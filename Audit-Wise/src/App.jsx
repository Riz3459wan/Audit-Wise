import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Uploads from "./pages/Uploads";
import Reports from "./pages/Reports";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import { tabSession } from "./utils/tabSession";

const PrivateRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(tabSession.isActive());
    };
    checkAuth();
  }, []);

  if (isAuth === null) {
    return <div>Loading...</div>;
  }

  return isAuth ? children : <Navigate to="/" />;
};

const ProtectedLayout = () => {
  return (
    <PrivateRoute>
      <Landing />
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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
