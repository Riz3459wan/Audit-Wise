export const tabSession = {
  set(data) {
    const sessionData = {
      ...data,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    sessionStorage.setItem("audit_session", JSON.stringify(sessionData));
  },

  get() {
    const session = sessionStorage.getItem("audit_session");
    return session ? JSON.parse(session) : null;
  },

  clear() {
    sessionStorage.removeItem("audit_session");
  },

  isActive() {
    return !!this.get();
  },

  updateLastActive() {
    const session = this.get();
    if (session) {
      session.lastActive = Date.now();
      this.set(session);
    }
  },

  getRemainingTime() {
    const session = this.get();
    if (session && session.lastActive) {
      const elapsed = Date.now() - session.lastActive;
      const timeout = 30 * 60 * 1000;
      return Math.max(0, timeout - elapsed);
    }
    return 0;
  },
};
