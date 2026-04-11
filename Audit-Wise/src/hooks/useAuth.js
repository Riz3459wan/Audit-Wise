import { useCallback, useEffect, useState } from "react";
import { db, dbHelpers } from "../database/db";
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

    tabSession.clear();
    setUser(null);

    await db.auth.put({
      id: 1,
      isLoggedIn: false,
      userId: null,
      tabId: null,
    });
  }, [user]);

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
    checkAuth();
  }, [checkAuth]);

  return { user, loading, login, logout, isAuthenticated: !!user };
};
