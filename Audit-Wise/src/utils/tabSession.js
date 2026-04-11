export const tabSession = {
  set(data) {
    sessionStorage.setItem("audit_session", JSON.stringify(data));
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
};
