import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { db } from "../database/db";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import InfoIcon from "@mui/icons-material/Info";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

const ProfileSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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
      }
    } catch (err) {
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfileData((prev) => ({ ...prev, avatar: null }));
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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let avatarData = profileData.avatar;
      if (avatarFile) {
        avatarData = await convertFileToBase64(avatarFile);
      }

      const result = await updateUserProfile({
        ...profileData,
        avatar: avatarData,
      });

      if (result.success) {
        setSuccess("Profile updated successfully!");
        setAvatarFile(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={4}>
        Manage your personal information and profile details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 4,
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            src={profileData.avatar}
            sx={{ width: 100, height: 100, bgcolor: "#6366f1" }}
          >
            {!profileData.avatar &&
              (profileData.fullName?.charAt(0)?.toUpperCase() || "U")}
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
              value={profileData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
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
              value={profileData.email}
              onChange={(e) => handleChange("email", e.target.value)}
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
              value={profileData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
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
              value={profileData.company}
              onChange={(e) => handleChange("company", e.target.value)}
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
              value={profileData.position}
              onChange={(e) => handleChange("position", e.target.value)}
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
              value={profileData.location}
              onChange={(e) => handleChange("location", e.target.value)}
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
              value={profileData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
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

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ px: 4, py: 1 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileSettings;
