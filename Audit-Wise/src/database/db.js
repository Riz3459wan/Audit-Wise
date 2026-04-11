import Dexie from "dexie";

export const db = new Dexie("AuditWiseDB");

db.version(1).stores({
  users:
    "++id, email, password, name, avatar, plan, createdAt, lastLogin, isActive",
  auth: "id, isLoggedIn, userId, tabId, lastActive, sessionToken",
  documents:
    "++id, userId, fileName, fileSize, fileType, filePath, status, scannedAt, originalImage, scannedImage",
  analyseResult:
    "++id, documentId, userId, extractedText, confidence, modelUsed, processedAt, language",
  reports:
    "++id, userId, documentId, reportName, reportType, findings, recommendations, riskScore, generatedAt, format, isShared",
  subscriptions:
    "++id, userId, plan, status, startDate, endDate, autoRenew, paymentId, amount",
  userSettings:
    "++id, userId, theme, notifications, language, timezone, emailAlerts, twoFactorAuth",
  auditLogs: "++id, userId, action, details, ipAddress, timestamp, documentId",
});

export const dbHelpers = {
  async createUser(userData) {
    const id = await db.users.add({
      ...userData,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    return id;
  },
  async getUserByEmail(email) {
    return await db.users.where("email").equals(email).first();
  },
  async saveDocument(userId, documentDate) {
    const id = await db.documents.add({
      ...documentDate,
      userId,
      scannedAt: new Date().toISOString(),
      status: "pending",
    });

    await this.logAudit(userId, "DOCUMENT_UPLOAD", { documentId: id });
    return id;
  },
  async saveAnalyseResult(documentId, userId, analyseData) {
    const id = await db.analyseResult.add({
      documentId,
      userId,
      ...analyseData,
      processedAt: new Date().toISOString(),
    });
    return id;
  },

  async saveReport(userId, documentId, reportData) {
    const id = await db.reports.add({
      userId,
      documentId,
      ...reportData,
      generatedAt: new Date().toISOString(),
    });

    await this.logAudit(userId, "REPORT_GENERATED", { reportId: id });
    return id;
  },

  async logAudit(userId, action, details = {}) {
    await db.auditLogs.add({
      userId,
      action,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ipAddress: "client-side",
    });
  },

  async getUserStats(userId) {
    const [totalDocs, totalReports, recentActivity] = await Promise.all([
      db.documents.where("userId").equals(userId).count(),
      db.reports.where("userId").equals(userId).count(),
      db.auditLogs.where("userId").equals(userId).reverse().limit(5).toArray(),
    ]);
    return { totalDocs, totalReports, recentActivity };
  },
};
