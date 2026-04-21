import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#0f172a" : "#f8fafc",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
