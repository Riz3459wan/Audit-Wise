import React, { useEffect, useState, useCallback } from "react";
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
  CircularProgress,
  useMediaQuery,
  useTheme as useMuiTheme,
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
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (debouncedSearch) {
      console.debug("Searching for:", debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#0f172a" : "#ffffff";
    document.body.style.color = darkMode ? "#ffffff" : "#0f172a";
  }, [darkMode]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSetting = () => {
    handleMenuClose();
    navigate("/profileSetting");
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
    setLogoutError("");
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      setLogoutError("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
    setLogoutError("");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      handleMenuClose();
    }
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
          ml: { xs: 0, md: 0 },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: darkMode ? "#1e293b" : "#e7eaee",
              padding: "5px 10px",
              borderRadius: "10px",
              width: isMobile ? "150px" : "300px",
              transition: "width 0.2s ease",
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
              aria-label="Search"
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <IconButton
              onClick={toggleTheme}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              size={isMobile ? "small" : "medium"}
            >
              {darkMode ? (
                <LightModeIcon sx={{ color: "white" }} />
              ) : (
                <DarkModeIcon sx={{ color: "gray" }} />
              )}
            </IconButton>

            <Box
              onClick={handleMenuOpen}
              onKeyDown={handleKeyDown}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
              aria-label="User menu"
              role="button"
              tabIndex={0}
            >
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  bgcolor: "#6366f1",
                }}
              >
                {getInitials(user?.name)}
              </Avatar>
              {!isMobile && (
                <Typography
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  {user?.name?.split(" ")[0] || "User"}
                </Typography>
              )}
            </Box>

            <Menu
              sx={{ marginTop: 1 }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
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
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    mx: "auto",
                    mb: 1,
                    bgcolor: "#6366f1",
                  }}
                >
                  {getInitials(user?.name)}
                </Avatar>
                <Typography fontWeight="bold">
                  {user?.name || "User Name"}
                </Typography>
                <Typography variant="body2" color="gray">
                  {user?.email || "user@gmail.com"}
                </Typography>
                <Typography
                  variant="caption"
                  color="#6366f1"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {user?.plan || "Free"} Plan
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
          {logoutError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {logoutError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleLogoutCancel}
            color="primary"
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Logout"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
