import Dexie from "dexie";

export const db = new Dexie("AuditWiseDB");

db.version(1).stores({
  users:
    "++id, email, password, name, avatar, plan, planUpdatedAt, monthlyUploadCount, monthlyResetDate, createdAt, lastLogin, isActive",
  auth: "id, isLoggedIn, userId, tabId, lastActive, sessionToken",
  documents:
    "++id, userId, fileName, fileSize, fileType, filePath, status, scannedAt, originalImage, scannedImage, extractedText, confidence",
  analyseResult:
    "++id, documentId, userId, extractedText, confidence, modelUsed, processedAt, language, analysis, sentiment, riskLevel, keyFindings, recommendations, mode, wordCount, charCount, summary",
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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const id = await db.users.add({
      ...userData,
      createdAt: now.toISOString(),
      isActive: true,
      plan: "free",
      monthlyUploadCount: 0,
      monthlyResetDate: firstDayOfMonth.toISOString(),
    });
    return id;
  },

  async getUserByEmail(email) {
    return await db.users.where("email").equals(email).first();
  },

  async checkAndResetMonthlyCount(userId) {
    const user = await db.users.get(userId);
    if (!user) return 0;

    const lastReset = new Date(user.monthlyResetDate);
    const now = new Date();

    const lastResetYear = lastReset.getFullYear();
    const lastResetMonth = lastReset.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (
      currentYear > lastResetYear ||
      (currentYear === lastResetYear && currentMonth > lastResetMonth)
    ) {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      await db.users.update(userId, {
        monthlyUploadCount: 0,
        monthlyResetDate: firstDayOfMonth.toISOString(),
      });
      return 0;
    }
    return user.monthlyUploadCount || 0;
  },

  async getUserMonthlyUsage(userId) {
    await this.checkAndResetMonthlyCount(userId);
    const user = await db.users.get(userId);
    const currentCount = user?.monthlyUploadCount || 0;

    const planLimits = {
      free: 5,
      pro: 50,
      business: 200,
    };

    const userPlan = user?.plan?.toLowerCase() || "free";
    const maxUploads = planLimits[userPlan] || 5;

    return {
      used: currentCount,
      total: maxUploads,
      remaining: Math.max(0, maxUploads - currentCount),
      plan: userPlan,
    };
  },

  async getCurrentMonthUploadCount(userId) {
    await this.checkAndResetMonthlyCount(userId);
    const user = await db.users.get(userId);
    return user?.monthlyUploadCount || 0;
  },

  async incrementMonthlyUploadCount(userId) {
    const user = await db.users.get(userId);
    if (user) {
      const currentCount = user.monthlyUploadCount || 0;
      const newCount = currentCount + 1;
      await db.users.update(userId, { monthlyUploadCount: newCount });
      return newCount;
    }
    return 0;
  },

  async saveDocument(userId, documentData) {
    const currentCount = await this.getCurrentMonthUploadCount(userId);
    const user = await db.users.get(userId);
    const planLimits = { free: 5, pro: 50, business: 200 };
    const userPlan = user?.plan?.toLowerCase() || "free";
    const maxAllowed = planLimits[userPlan] || 5;

    if (currentCount >= maxAllowed) {
      throw new Error(
        `Monthly limit of ${maxAllowed} uploads reached for ${userPlan} plan`,
      );
    }

    const id = await db.documents.add({
      ...documentData,
      userId,
      scannedAt: new Date().toISOString(),
      status: "completed",
    });

    const newCount = await this.incrementMonthlyUploadCount(userId);

    await this.logAudit(userId, "DOCUMENT_UPLOAD", {
      documentId: id,
      monthlyCount: newCount,
      limit: maxAllowed,
    });

    return id;
  },

  async saveAnalyseResult(documentId, userId, analyseData) {
    const id = await db.analyseResult.add({
      documentId,
      userId,
      ...analyseData,
      processedAt: new Date().toISOString(),
    });

    await db.documents.update(documentId, {
      extractedText: analyseData.extractedText,
      confidence: analyseData.confidence,
    });

    return id;
  },

  async getAnalyseResultByDocumentId(documentId) {
    return await db.analyseResult
      .where("documentId")
      .equals(documentId)
      .first();
  },

  async getAllAnalyseResults(userId) {
    return await db.analyseResult
      .where("userId")
      .equals(userId)
      .reverse()
      .toArray();
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

  async getDocumentCount(userId) {
    return await db.documents.where("userId").equals(userId).count();
  },

  async forceResetMonthlyCount(userId) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    await db.users.update(userId, {
      monthlyUploadCount: 0,
      monthlyResetDate: firstDayOfMonth.toISOString(),
    });
    return 0;
  },
};

export default db;
