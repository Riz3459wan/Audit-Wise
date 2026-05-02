import { useCallback, useEffect, useState } from "react";
import { db, dbHelpers, PLAN_LIMITS } from "../database/db";
import { tabSession } from "../utils/tabSession";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    try {
      const foundUser = await dbHelpers.getUserByEmail(email);

      if (foundUser && foundUser.password === password) {
        const sessionData = {
          userId: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          loggedInAt: Date.now(),
          tabId: crypto.randomUUID(),
          plan: foundUser.plan,
        };
        tabSession.set(sessionData);
        setUser(foundUser);

        await db.auth.put({
          id: 1,
          isLoggedIn: true,
          userId: foundUser.id,
          tabId: sessionData.tabId,
          lastActive: Date.now(),
        });

        await dbHelpers.logAudit(foundUser.id, "LOGIN", { method: "password" });

        const pendingTrialData = sessionStorage.getItem("pendingTrialData");
        if (pendingTrialData) {
          return { success: true, hasPendingTrialData: true };
        }

        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) {
        await dbHelpers.logAudit(user.id, "LOGOUT", {});
      }
    } catch (error) {
      console.error("Logout audit failed:", error);
    } finally {
      tabSession.clear();
      setUser(null);
      try {
        await db.auth.put({
          id: 1,
          isLoggedIn: false,
          userId: null,
          tabId: null,
          lastActive: null,
        });
      } catch (error) {
        console.error("Failed to update auth record:", error);
      }
    }
  }, [user]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const session = tabSession.get();

    if (session) {
      try {
        const foundUser = await db.users.get(session.userId);
        if (foundUser && foundUser.isActive !== false) {
          const expiryDate = foundUser.planExpiryDate
            ? new Date(foundUser.planExpiryDate)
            : null;
          const now = new Date();

          if (expiryDate && now > expiryDate && foundUser.plan !== "free") {
            await db.users.update(session.userId, {
              plan: "free",
              planExpiryDate: null,
              monthlyUploadCount: 0,
              extraUploads: 0,
            });
            foundUser.plan = "free";
            foundUser.planExpiryDate = null;
            const updatedSession = { ...session, plan: "free" };
            tabSession.set(updatedSession);
          }

          setUser(foundUser);
          tabSession.updateLastActive();
        } else {
          tabSession.clear();
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        tabSession.clear();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const updateUserPlan = useCallback(
    async (newPlan) => {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      try {
        const now = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await db.users.update(user.id, {
          plan: newPlan.toLowerCase(),
          planUpdatedAt: Date.now(),
          planExpiryDate: expiryDate.toISOString(),
          monthlyUploadCount: 0,
          extraUploads: 0,
        });

        const updatedUser = await db.users.get(user.id);
        setUser(updatedUser);

        const currentSession = tabSession.get();
        if (currentSession) {
          tabSession.set({
            ...currentSession,
            plan: newPlan.toLowerCase(),
          });
        }

        await dbHelpers.logAudit(user.id, "PLAN_UPDATED", {
          oldPlan: user.plan,
          newPlan: newPlan,
          expiryDate: expiryDate.toISOString(),
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [user],
  );

  const addExtraUploads = useCallback(
    async (extraCount, price) => {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      try {
        const newExtraCount = await dbHelpers.addExtraUploads(
          user.id,
          extraCount,
          price,
        );
        const updatedUser = await db.users.get(user.id);
        setUser(updatedUser);

        await dbHelpers.logAudit(user.id, "EXTRA_UPLOADS_ADDED", {
          extraCount: extraCount,
          totalExtra: newExtraCount,
          price: price,
        });

        return { success: true, totalExtra: newExtraCount };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [user],
  );

  const updateUserProfile = useCallback(
    async (profileData) => {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      try {
        await db.users.update(user.id, {
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          company: profileData.company,
          position: profileData.position,
          location: profileData.location,
          bio: profileData.bio,
          avatar: profileData.avatar,
          updatedAt: new Date().toISOString(),
        });

        const updatedUser = await db.users.get(user.id);
        setUser(updatedUser);

        const currentSession = tabSession.get();
        if (currentSession) {
          tabSession.set({
            ...currentSession,
            email: updatedUser.email,
            name: updatedUser.fullName || updatedUser.name,
          });
        }

        await dbHelpers.logAudit(user.id, "PROFILE_UPDATED", {
          updatedFields: Object.keys(profileData),
        });

        window.dispatchEvent(new CustomEvent("profileUpdated"));

        return { success: true };
      } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: error.message };
      }
    },
    [user],
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      try {
        const dbUser = await db.users.get(user.id);
        if (dbUser.password !== currentPassword) {
          return { success: false, error: "Current password is incorrect" };
        }

        if (newPassword.length < 6) {
          return {
            success: false,
            error: "Password must be at least 6 characters",
          };
        }

        await db.users.update(user.id, {
          password: newPassword,
          passwordUpdatedAt: new Date().toISOString(),
        });

        await dbHelpers.logAudit(user.id, "PASSWORD_CHANGED", {});

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [user],
  );

  const updateSecuritySettings = useCallback(
    async (securitySettings) => {
      if (!user) {
        return { success: false, error: "No user logged in" };
      }

      try {
        await db.users.update(user.id, {
          securitySettings: securitySettings,
          updatedAt: new Date().toISOString(),
        });

        const updatedUser = await db.users.get(user.id);
        setUser(updatedUser);

        await dbHelpers.logAudit(user.id, "SECURITY_SETTINGS_UPDATED", {
          settings: securitySettings,
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [user],
  );

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUserPlan,
    addExtraUploads,
    updateUserProfile,
    changePassword,
    updateSecuritySettings,
  };
};
