import React, { useMemo, useState } from "react";
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
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

import DashboardIcon from "@mui/icons-material/Dashboard";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddCardIcon from "@mui/icons-material/AddCard";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo(
    () => [
      { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
      { text: "Uploads", icon: <UploadFileIcon />, path: "/upload" },
      { text: "Reports", icon: <BarChartIcon />, path: "/report" },
      { text: "Pricing", icon: <AddCardIcon />, path: "/price" },
      { text: "Settings", icon: <SettingsIcon />, path: "/setting" },
    ],
    [],
  );

  const handleNavigation = (path) => {
    try {
      navigate(path);
      if (isMobile) setMobileOpen(false);
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  };

  const handleKeyDown = (event, path) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigation(path);
    }
  };

  const handleUpgradePlan = () => {
    try {
      navigate("/price");
      if (isMobile) setMobileOpen(false);
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  };

  const shouldShowUpgrade = user?.plan?.toLowerCase() !== "business";

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShieldOutlinedIcon />
          {!collapsed && !isMobile && (
            <Typography variant="h6" fontWeight="bold" noWrap>
              Audit Wise
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {(!collapsed || isMobile) && (
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
          Admin Dashboard
        </Typography>
      )}

      <Divider sx={{ bgcolor: darkMode ? "#334155" : "#e2e8f0", mb: 2 }} />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={index} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                onKeyDown={(e) => handleKeyDown(e, item.path)}
                sx={{
                  borderRadius: "10px",
                  justifyContent:
                    collapsed && !isMobile ? "center" : "flex-start",
                  px: collapsed && !isMobile ? 1 : 2,
                  py: 1.5,
                  backgroundColor: isActive ? "#25d5db" : "transparent",
                  "&:hover": {
                    backgroundColor: "#25d5db",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #6366f1",
                    outlineOffset: "2px",
                  },
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#fff" : "#0096d6",
                    minWidth: collapsed && !isMobile ? "auto" : 40,
                    mr: collapsed && !isMobile ? 0 : 2,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || isMobile) && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { color: isActive ? "#fff" : "inherit" },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {shouldShowUpgrade && (!collapsed || isMobile) && (
        <Tooltip
          title={
            user?.plan === "pro"
              ? "Upgrade to Business for more features"
              : "Upgrade your plan"
          }
        >
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
            {user?.plan === "pro" ? "Upgrade to Business" : "Upgrade Plan"}
          </Button>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <IconButton
        onClick={() => setMobileOpen(true)}
        sx={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 1200,
          backgroundColor: darkMode ? "#1e293b" : "#fff",
          boxShadow: 2,
          display: { xs: "flex", md: "none" },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            background: darkMode
              ? "linear-gradient(180deg, #1e293b, #0f172a)"
              : "linear-gradient(180deg, #f8fafc, #f1f5f9)",
            color: darkMode ? "#fff" : "black",
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: "border-box",
            background: darkMode
              ? "linear-gradient(180deg, #1e293b, #0f172a)"
              : "linear-gradient(180deg, #f8fafc, #f1f5f9)",
            color: darkMode ? "#fff" : "black",
            borderRight: "none",
            transition: "width 0.2s ease",
            overflowX: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
