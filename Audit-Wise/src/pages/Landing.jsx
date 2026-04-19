import React from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { Outlet } from "react-router-dom";

const Landing = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: "calc(100% - 260px)" },
        }}
      >
        <Navbar />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mt: { xs: 0, sm: 0 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
