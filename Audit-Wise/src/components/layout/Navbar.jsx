import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddCardIcon from "@mui/icons-material/AddCard";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import useDebounce from "../../hooks/UseDebounce";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../database/db";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: null,
    plan: "Free",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);
  const open = Boolean(anchorEl);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Reports", icon: <BarChartIcon />, path: "/report" },
    { text: "Price", icon: <AddCardIcon />, path: "/price" },
    { text: "Uploads", icon: <UploadFileIcon />, path: "/price" },
    { text: "Settings", icon: <SettingsIcon />, path: "/setting" },
  ];

  useEffect(() => {
    if (debouncedSearch) {
      console.log("Searching for:", debouncedSearch);
    }
  }, [debouncedSearch]);

  // useEffect(() => {
  //   document.body.style.backgroundColor = darkMode ? "#0f172a" : "#ffffff";
  //   document.body.style.color = darkMode ? "#ffffff" : "#0f172a";
  // }, [darkMode]);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  const loadUserProfile = async () => {
    if (!user?.id) {
      setProfileData({
        name: user?.name || "User Name",
        email: user?.email || "user@gmail.com",
        avatar: null,
        plan: user?.plan || "Free",
      });
      return;
    }

    try {
      const userData = await db.users.get(user.id);
      if (userData) {
        setProfileData({
          name: userData.fullName || user.name || "User Name",
          email: userData.email || user.email || "user@gmail.com",
          avatar: userData.avatar || null,
          plan: userData.plan || user.plan || "Free",
        });
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setProfileData({
        name: user?.name || "User Name",
        email: user?.email || "user@gmail.com",
        avatar: null,
        plan: user?.plan || "Free",
      });
    }
  };

  const handleMenuOpen = (event) => {
    loadUserProfile();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSetting = () => {
    handleClose();
    navigate("/setting");
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleLogoutClick = () => {
    handleClose();
    setLogoutDialogOpen(true);
    setLogoutError("");
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      setLogoutError("Failed to logout. Please try again.");
    }
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
    setLogoutError("");
  };

  const handleUpgradePlan = () => {
    navigate("/price");
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const UserAvatar = ({ size = 32 }) => (
    <Avatar
      src={profileData.avatar}
      sx={{ width: size, height: size, bgcolor: "#6366f1" }}
    >
      {!profileData.avatar && (profileData.name?.charAt(0)?.toUpperCase() || "U")}
    </Avatar>
  );

  const drawerContent = (
    <Box sx={{ width: 280, p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, px: 1 }}>
        <ShieldOutlinedIcon sx={{ mr: 1, color: "#6366f1", fontSize: 32 }} />
        <Typography variant="h6" fontWeight="bold">
          Audit<span style={{ color: "#6366f1" }}>Wise</span>
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: "10px",
                mb: 1,
                backgroundColor: isActive(item.path)
                  ? darkMode
                    ? "rgba(99, 102, 241, 0.2)"
                    : "#e0e7ff"
                  : "transparent",
                "&:hover": {
                  backgroundColor: darkMode ? "#1e293b" : "#f1f5f9",
                },
              }}
            >
              <ListItemIcon
                sx={{ color: isActive(item.path) ? "#6366f1" : "#94a3b8" }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: {
                    color: isActive(item.path) ? "#6366f1" : "inherit",
                    fontWeight: isActive(item.path) ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2, px: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleUpgradePlan}
          sx={{
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

      <Box sx={{ mt: "auto", pt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <UserAvatar size={40} />
            <Box>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {profileData.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap>
                {profileData.email}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${profileData.plan} Plan`}
            size="small"
            sx={{ bgcolor: "#6366f1", color: "white" }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: darkMode ? "#0f172a" : "#ffffff",
          color: darkMode ? "#fff" : "#000",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setMobileDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              onClick={() => handleNavigation("/dashboard")}
            >
              <ShieldOutlinedIcon
                sx={{ mr: 1, color: "#6366f1", fontSize: 32 }}
              />
              <Typography variant="h6" fontWeight="bold">
                Audit<span style={{ color: "#6366f1" }}>Wise</span>
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isActive(item.path) ? "#6366f1" : "inherit",
                    fontWeight: isActive(item.path) ? 600 : 400,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: darkMode ? "#1e293b" : "#f1f5f9",
                    },
                  }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!isMobile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: darkMode ? "#1e293b" : "#f1f5f9",
                  padding: "5px 10px",
                  borderRadius: "10px",
                  width: "250px",
                }}
              >
                <SearchIcon sx={{ color: "#94a3b8" }} />
                <InputBase
                  placeholder="Search..."
                  sx={{ ml: 1, flex: 1 }}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Box>
            )}

            <IconButton onClick={toggleTheme}>
              {darkMode ? (
                <LightModeIcon sx={{ color: "white" }} />
              ) : (
                <DarkModeIcon sx={{ color: "#64748b" }} />
              )}
            </IconButton>

            <Box
              onClick={handleMenuOpen}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
            >
              <UserAvatar size={32} />
              {!isMobile && (
                <Typography
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  {profileData.name?.split(" ")[0] || "Account"}
                </Typography>
              )}
            </Box>

            <Menu
              sx={{ marginTop: 1 }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Box sx={{ px: 2, py: 1 }} align="center">
                <UserAvatar size={48} />
                <Typography fontWeight="bold" sx={{ mt: 1 }}>
                  {profileData.name}
                </Typography>
                <Typography variant="body2" color="gray">
                  {profileData.email}
                </Typography>
                <Chip
                  label={`${profileData.plan} Plan`}
                  size="small"
                  sx={{ mt: 1, bgcolor: "#6366f1", color: "white" }}
                />
              </Box>

              <Divider />

              <MenuItem onClick={handleSetting}>
                <SettingsApplicationsIcon sx={{ mr: 1 }} />
                Account Settings
              </MenuItem>

              <MenuItem onClick={() => handleNavigation("/price")}>
                <AddCardIcon sx={{ mr: 1 }} />
                Upgrade Plan
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogoutClick} sx={{ color: "red" }}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: darkMode ? "#0f172a" : "#ffffff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{
          sx: {
            borderRadius: "15px",
            padding: 1,
          },
        }}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout? You will need to login again to
            access your dashboard.
          </DialogContentText>
          {logoutError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {logoutError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;