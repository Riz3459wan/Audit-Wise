import React, { useState, useEffect, useCallback, memo } from "react";
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
  CardContent,
  Alert,
  AlertTitle,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery,
  InputAdornment,
  CircularProgress,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAuth } from "../hooks/useAuth";
import { db } from "../database/db";

const ProfileSettings = memo(
  ({
    profileData,
    savingProfile,
    onProfileChange,
    onSave,
    onAvatarUpload,
    onAvatarRemove,
    user,
  }) => (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Profile Information
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Update your personal information and profile details
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Avatar
          src={profileData.avatar}
          sx={{ width: 100, height: 100, boxShadow: 2 }}
        >
          {profileData.fullName?.charAt(0)?.toUpperCase() ||
            user?.name?.charAt(0)?.toUpperCase() ||
            "U"}
        </Avatar>
        <Box>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            onChange={onAvatarUpload}
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PhotoCameraIcon />}
              sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
            >
              Upload Photo
            </Button>
          </label>
          {profileData.avatar && (
            <Button
              variant="outlined"
              color="error"
              onClick={onAvatarRemove}
              startIcon={<DeleteIcon />}
            >
              Remove
            </Button>
          )}
          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Recommended: Square image, max 5MB
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={profileData.fullName || ""}
            onChange={(e) => onProfileChange("fullName", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
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
            value={profileData.email || ""}
            onChange={(e) => onProfileChange("email", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={profileData.phone || ""}
            onChange={(e) => onProfileChange("phone", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company"
            value={profileData.company || ""}
            onChange={(e) => onProfileChange("company", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Position"
            value={profileData.position || ""}
            onChange={(e) => onProfileChange("position", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WorkIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={profileData.location || ""}
            onChange={(e) => onProfileChange("location", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="action" />
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
            value={profileData.bio || ""}
            onChange={(e) => onProfileChange("bio", e.target.value)}
            placeholder="Tell us about yourself..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <InfoIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={savingProfile}
          startIcon={
            savingProfile ? <CircularProgress size={20} /> : <SaveIcon />
          }
          sx={{ px: 4, py: 1 }}
        >
          {savingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  ),
);

ProfileSettings.displayName = "ProfileSettings";

const SecuritySettings = memo(
  ({
    securitySettings,
    passwordData,
    savingSecurity,
    changingPassword,
    showPassword,
    onSecurityChange,
    onPasswordChange,
    onSaveSecurity,
    onChangePassword,
    onToggleShowPassword,
  }) => (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Security Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Manage your account security and authentication
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Change Password
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword || ""}
                onChange={(e) =>
                  onPasswordChange("currentPassword", e.target.value)
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={onToggleShowPassword} edge="end">
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
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
                value={passwordData.newPassword || ""}
                onChange={(e) =>
                  onPasswordChange("newPassword", e.target.value)
                }
                helperText="Minimum 8 characters"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword || ""}
                onChange={(e) =>
                  onPasswordChange("confirmPassword", e.target.value)
                }
                error={
                  passwordData.newPassword !== passwordData.confirmPassword &&
                  passwordData.confirmPassword !== ""
                }
                helperText={
                  passwordData.newPassword !== passwordData.confirmPassword &&
                  passwordData.confirmPassword !== ""
                    ? "Passwords do not match"
                    : ""
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={onChangePassword}
              disabled={
                changingPassword ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
              startIcon={
                changingPassword ? <CircularProgress size={20} /> : null
              }
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.twoFactorAuth || false}
                onChange={(e) =>
                  onSecurityChange("twoFactorAuth", e.target.checked)
                }
                color="primary"
              />
            }
            label="Enable Two-Factor Authentication"
          />
          <Typography
            variant="caption"
            color="textSecondary"
            display="block"
            sx={{ mt: 1 }}
          >
            Add an extra layer of security to your account.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Session Timeout
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Session Timeout</InputLabel>
            <Select
              value={securitySettings.sessionTimeout || "30"}
              onChange={(e) =>
                onSecurityChange("sessionTimeout", e.target.value)
              }
              label="Session Timeout"
            >
              <MenuItem value="15">15 minutes</MenuItem>
              <MenuItem value="30">30 minutes</MenuItem>
              <MenuItem value="60">1 hour</MenuItem>
              <MenuItem value="120">2 hours</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Login Alerts
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.loginAlerts || false}
                onChange={(e) =>
                  onSecurityChange("loginAlerts", e.target.checked)
                }
                color="primary"
              />
            }
            label="Email me when someone logs into my account"
          />
        </CardContent>
      </Card>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onSaveSecurity}
          disabled={savingSecurity}
          startIcon={
            savingSecurity ? <CircularProgress size={20} /> : <SaveIcon />
          }
          sx={{ px: 4, py: 1 }}
        >
          {savingSecurity ? "Saving..." : "Save Security Settings"}
        </Button>
      </Box>
    </Box>
  ),
);

SecuritySettings.displayName = "SecuritySettings";

const NotificationSettings = memo(() => (
  <Box>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      Notification Preferences
    </Typography>
    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
      Manage how you receive notifications
    </Typography>

    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Email Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Document analysis completed"
        />
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          sx={{ mb: 2, ml: 4 }}
        >
          Receive email when your document analysis is complete
        </Typography>

        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Monthly usage reports"
        />
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          sx={{ mb: 2, ml: 4 }}
        >
          Get monthly summary of your document uploads and usage
        </Typography>

        <FormControlLabel
          control={<Switch color="primary" />}
          label="Marketing communications"
        />
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          sx={{ ml: 4 }}
        >
          Receive updates about new features and promotions
        </Typography>
      </CardContent>
    </Card>

    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          In-App Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Analysis results"
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="System updates"
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Tips and tutorials"
        />
      </CardContent>
    </Card>

    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        sx={{ px: 4, py: 1 }}
      >
        Save Preferences
      </Button>
    </Box>
  </Box>
));

NotificationSettings.displayName = "NotificationSettings";

const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, updateUserProfile, changePassword, updateSecuritySettings } =
    useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          fullName: userData.fullName || user.name || "",
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
      setErrorMessage("Failed to load user settings");
    }
  };

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    setSuccessMessage("");
    setErrorMessage("");
  }, []);

  const handleProfileChange = useCallback((field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSecurityChange = useCallback((field, value) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handlePasswordChange = useCallback((field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let avatarData = profileData.avatar;

      if (avatarFile) {
        avatarData = await convertFileToBase64(avatarFile);
      }

      const result = await updateUserProfile({
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        position: profileData.position,
        location: profileData.location,
        bio: profileData.bio,
        avatar: avatarData,
      });

      if (result.success) {
        setAvatarFile(null);
        setSuccessMessage("Profile settings saved successfully!");
        await loadUserSettings();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "Failed to save profile settings");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setErrorMessage("Failed to save profile settings. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSavingSecurity(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await updateSecuritySettings(securitySettings);

      if (result.success) {
        setSuccessMessage("Security settings updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "Failed to update security settings");
      }
    } catch (error) {
      console.error("Failed to save security settings:", error);
      setErrorMessage("Failed to update security settings.");
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setChangingPassword(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      if (result.success) {
        setSuccessMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setErrorMessage(
        "Failed to change password. Please check your current password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please upload an image file");
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    setProfileData((prev) => ({
      ...prev,
      avatar: null,
    }));
    setAvatarFile(null);
  }, []);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const tabs = [
    { label: "Profile", icon: <PersonIcon /> },
    { label: "Security", icon: <SecurityIcon /> },
    { label: "Notifications", icon: <NotificationsIcon /> },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: isMobile ? 2 : 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          fontWeight="bold"
          gutterBottom
        >
          Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccessMessage("")}
          icon={<CheckCircleIcon />}
        >
          <AlertTitle>Success</AlertTitle>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setErrorMessage("")}
        >
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 2 }}>
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
              sx={{ minHeight: 64, py: 2 }}
            />
          ))}
        </Tabs>

        <Box sx={{ p: isMobile ? 2 : 4 }}>
          {activeTab === 0 && (
            <ProfileSettings
              profileData={profileData}
              savingProfile={savingProfile}
              onProfileChange={handleProfileChange}
              onSave={handleSaveProfile}
              onAvatarUpload={handleAvatarUpload}
              onAvatarRemove={handleRemoveAvatar}
              user={user}
            />
          )}
          {activeTab === 1 && (
            <SecuritySettings
              securitySettings={securitySettings}
              passwordData={passwordData}
              savingSecurity={savingSecurity}
              changingPassword={changingPassword}
              showPassword={showPassword}
              onSecurityChange={handleSecurityChange}
              onPasswordChange={handlePasswordChange}
              onSaveSecurity={handleSaveSecurity}
              onChangePassword={handleChangePassword}
              onToggleShowPassword={toggleShowPassword}
            />
          )}
          {activeTab === 2 && <NotificationSettings />}
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
