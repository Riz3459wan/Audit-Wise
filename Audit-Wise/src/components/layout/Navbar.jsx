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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import LogoutIcon from "@mui/icons-material/Logout";
import useDebounce from "../../hooks/UseDebounce";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (debouncedSearch) {
      console.log("Searching for:", debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#0f172a" : "#ffffff";
    document.body.style.color = darkMode ? "#ffffff" : "#0f172a";
  }, [darkMode]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetting = () => {
    handleClose();
    navigate("/profileSetting");
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleLogoutClick = () => {
    handleClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = async () => {
    await logout();
    setLogoutDialogOpen(false);
    navigate("/", { replace: true });
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: darkMode ? "#0f172a" : "#ffffff",
          color: darkMode ? "#fff" : "#000",
          boxShadow: "none",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: darkMode ? "#1e293b" : "#e7eaee",
              padding: "5px 10px",
              borderRadius: "10px",
              width: "300px",
            }}
          >
            <SearchIcon sx={{ color: "#0096d6" }} />
            <InputBase
              placeholder="Search..."
              sx={{
                ml: 1,
                flex: 1,
                borderRadius: 2,
              }}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={toggleTheme}>
              {darkMode ? (
                <LightModeIcon sx={{ color: "white" }} />
              ) : (
                <DarkModeIcon sx={{ color: "gray" }} />
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
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#6366f1" }}>
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </Avatar>
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
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#6366f1" }}>
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </Avatar>
                <Typography fontWeight="bold">
                  {user?.name || "User Name"}
                </Typography>
                <Typography variant="body2" color="gray">
                  {user?.email || "user@gmail.com"}
                </Typography>
              </Box>

              <Divider />

              <MenuItem onClick={handleSetting}>
                <SettingsApplicationsIcon sx={{ mr: 1 }} />
                Account Settings
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
