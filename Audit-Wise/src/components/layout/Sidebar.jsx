import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

import DashboardIcon from "@mui/icons-material/Dashboard";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddCardIcon from "@mui/icons-material/AddCard";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

const drawerWidth = 260;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Uploads", icon: <UploadFileIcon />, path: "/upload" },
    { text: "Reports", icon: <BarChartIcon />, path: "/report" },
    { text: "Pricing", icon: <AddCardIcon />, path: "/price" },
    { text: "Settings", icon: <SettingsIcon />, path: "/setting" },
  ];

  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  };

  const handleUpgradePlan = () => {
    try {
      navigate("/price");
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: darkMode
              ? "linear-gradient(180deg, #1e293b, #0f172a)"
              : "linear-gradient(180deg, #f8fafc, #f1f5f9)",
            color: darkMode ? "#fff" : "black",
            padding: "16px",
            fontFamily: "Roboto, sans-serif",
          },
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            <ShieldOutlinedIcon />
            Audit Wise
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Admin Dashboard
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: "#334155", mb: 2 }} />

        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: "10px",
                  mb: 1,
                  backgroundColor:
                    location.pathname === item.path ? "#25d5db" : "transparent",
                  "&:hover": {
                    backgroundColor: "#25d5db",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#0096d6" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Box>
          <Button
            variant="contained"
            fullWidth
            onClick={handleUpgradePlan}
            sx={{
              mt: 2,
              background: "linear-gradient(90deg, #38bdf8, #6366f1)",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "10px",
              padding: "10px",
              "&:hover": {
                background: "linear-gradient(90deg, #0ea5e9, #4f46e5)",
              },
            }}
          >
            Upgrade Plan
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
