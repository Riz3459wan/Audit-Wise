import { useCallback, useEffect, useState } from "react";
import { db, dbHelpers, PLAN_LIMITS } from "../database/db";
import { tabSession } from "../utils/tabSession";

const simpleHash = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  const login = useCallback(async (email, password) => {
    try {
      const foundUser = await dbHelpers.getUserByEmail(email);

      if (!foundUser) {
        return { success: false, error: "Invalid credentials" };
      }

      const hashedPassword = await simpleHash(password);

      if (
        foundUser.password === password ||
        foundUser.password === hashedPassword
      ) {
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
    if (user) {
      await dbHelpers.logAudit(user.id, "LOGOUT", {});
    }

    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }

    tabSession.clear();
    setUser(null);

    await db.auth.put({
      id: 1,
      isLoggedIn: false,
      userId: null,
      tabId: null,
    });
  }, [user, sessionTimeout]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const session = tabSession.get();

    if (session) {
      const foundUser = await db.users.get(session.userId);
      if (foundUser && foundUser.isActive) {
        setUser(foundUser);
        tabSession.updateLastActive();
      } else {
        tabSession.clear();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkSessionActivity = () => {
      const session = tabSession.get();
      if (session && session.lastActive) {
        const inactiveTime = Date.now() - session.lastActive;
        const timeoutMs = 30 * 60 * 1000; // 30 minutes

        if (inactiveTime > timeoutMs) {
          logout();
        }
      }
    };

    const interval = setInterval(checkSessionActivity, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [user, logout]);

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

  const refreshUser = useCallback(async () => {
    if (user) {
      const updatedUser = await db.users.get(user.id);
      setUser(updatedUser);
    }
  }, [user]);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUserPlan,
    addExtraUploads,
    refreshUser,
  };
};
