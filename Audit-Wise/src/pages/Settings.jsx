import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  AlertTitle,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAuth } from "../hooks/useAuth";
import { db } from "../database/db";

const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    location: "",
    bio: "",
    avatar: null,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    loginAlerts: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const userData = await db.users.get(user.id);
      if (userData) {
        setProfileData({
          fullName: userData.fullName || user.fullName || "",
          email: userData.email || user.email || "",
          phone: userData.phone || "",
          company: userData.company || "",
          position: userData.position || "",
          location: userData.location || "",
          bio: userData.bio || "",
          avatar: userData.avatar || null,
        });
        
        if (userData.securitySettings) {
          setSecuritySettings(userData.securitySettings);
        }
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handleSecurityChange = (field) => (event) => {
    setSecuritySettings({
      ...securitySettings,
      [field]: event.target.value || event.target.checked,
    });
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData({
      ...passwordData,
      [field]: event.target.value,
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let avatarData = profileData.avatar;
      
      if (avatarFile) {
        avatarData = await convertFileToBase64(avatarFile);
        setProfileData(prev => ({ ...prev, avatar: avatarData }));
      }

      await db.users.update(user.id, {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        position: profileData.position,
        location: profileData.location,
        bio: profileData.bio,
        avatar: avatarData,
        updatedAt: new Date().toISOString(),
      });

      if (updateUserProfile) {
        await updateUserProfile({
          fullName: profileData.fullName,
          email: profileData.email,
          avatar: avatarData,
        });
      }

      setAvatarFile(null);
      setSuccessMessage("Profile settings saved successfully!");
      
      window.dispatchEvent(new CustomEvent("profileUpdated"));
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setErrorMessage("Failed to save profile settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await db.users.update(user.id, {
        securitySettings: securitySettings,
        updatedAt: new Date().toISOString(),
      });
      
      setSuccessMessage("Security settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save security settings:", error);
      setErrorMessage("Failed to update security settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (updateUserProfile) {
        await updateUserProfile({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      }
      
      setSuccessMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to change password:", error);
      setErrorMessage("Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };


  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({
          ...profileData,
          avatar: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfileData({
      ...profileData,
      avatar: null,
    });
    setAvatarFile(null);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const ProfileSettings = () => (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Profile Information
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Update your personal information and profile details
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Avatar
          src={profileData.avatar}
          sx={{ width: 100, height: 100, mr: 3 }}
        >
          {profileData.fullName?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
        <Box>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarUpload}
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PhotoCameraIcon />}
              sx={{ mr: 1 }}
            >
              Upload Photo
            </Button>
          </label>
          {profileData.avatar && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveAvatar}
            >
              Remove
            </Button>
          )}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Recommended: Square image, max 5MB
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={profileData.fullName}
            onChange={handleProfileChange("fullName")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={profileData.email}
            onChange={handleProfileChange("email")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={profileData.phone}
            onChange={handleProfileChange("phone")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company"
            value={profileData.company}
            onChange={handleProfileChange("company")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Position"
            value={profileData.position}
            onChange={handleProfileChange("position")}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={profileData.location}
            onChange={handleProfileChange("location")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={3}
            value={profileData.bio}
            onChange={handleProfileChange("bio")}
            placeholder="Tell us about yourself..."
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSaveProfile}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );

  const SecuritySettings = () => (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Security Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Manage your account security and authentication
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Change Password
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={handlePasswordChange("currentPassword")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={handlePasswordChange("newPassword")}
              helperText="Minimum 8 characters"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
          >
            Update Password
          </Button>
        </Box>
      </Card>


     <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSaveSecurity}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          Save Security Settings
        </Button>
      </Box>
    </Box>
  );

  const tabs = [
    { label: "Profile", icon: <PersonIcon /> },
    { label: "Security", icon: <SecurityIcon /> },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: isMobile ? 2 : 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={!isMobile && tab.label}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>

        <Box sx={{ p: isMobile ? 2 : 4 }}>
          {activeTab === 0 && <ProfileSettings />}
          {activeTab === 1 && <SecuritySettings />}
        </Box>
      </Paper>

    
    </Box>
  );
};

export default Settings;