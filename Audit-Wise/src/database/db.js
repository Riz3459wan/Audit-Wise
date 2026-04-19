import Dexie from "dexie";

export const db = new Dexie("AuditWiseDB");

export const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  business: 200,
};

export const PLAN_PRICES = {
  free: 0,
  pro: 499,
  business: 999,
};

db.version(1).stores({
  users:
    "++id, email, password, name, avatar, plan, planUpdatedAt, planExpiryDate, monthlyUploadCount, monthlyResetDate, createdAt, lastLogin, isActive, extraUploads",
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
  addOns: "++id, userId, extraUploads, purchaseDate, expiryDate, isActive",
});

db.version(2)
  .stores({
    users:
      "++id, email, password, name, avatar, plan, planUpdatedAt, planExpiryDate, monthlyUploadCount, monthlyResetDate, createdAt, lastLogin, isActive, extraUploads",
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
    auditLogs:
      "++id, userId, action, details, ipAddress, timestamp, documentId",
    addOns: "++id, userId, extraUploads, purchaseDate, expiryDate, isActive",
  })
  .upgrade(async (trans) => {
    const users = await trans.table("users").toArray();
    for (const user of users) {
      if (user.extraUploads === undefined || user.extraUploads === null) {
        await trans.table("users").update(user.id, { extraUploads: 0 });
      }
      if (!user.planExpiryDate && user.plan !== "free") {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        await trans
          .table("users")
          .update(user.id, { planExpiryDate: expiryDate.toISOString() });
      }
      if (!user.monthlyResetDate) {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        await trans
          .table("users")
          .update(user.id, { monthlyResetDate: firstDayOfMonth.toISOString() });
      }
    }
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
      extraUploads: 0,
      planExpiryDate: null,
    });
    return id;
  },

  async getUserByEmail(email) {
    return await db.users.where("email").equals(email.toLowerCase()).first();
  },

  async checkAndResetMonthlyCount(userId) {
    const user = await db.users.get(userId);
    if (!user) return 0;

    const now = new Date();

    if (user.plan !== "free" && user.planExpiryDate) {
      const expiryDate = new Date(user.planExpiryDate);
      if (now > expiryDate) {
        await db.users.update(userId, {
          plan: "free",
          planExpiryDate: null,
          monthlyUploadCount: 0,
          extraUploads: 0,
        });
        return 0;
      }
    }

    const lastReset = new Date(user.monthlyResetDate);
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
    const extraUploads = user?.extraUploads || 0;

    const userPlan = user?.plan?.toLowerCase() || "free";
    const baseLimit = PLAN_LIMITS[userPlan] || 5;
    const totalLimit = baseLimit + extraUploads;

    return {
      used: currentCount,
      total: totalLimit,
      remaining: Math.max(0, totalLimit - currentCount),
      plan: userPlan,
      baseLimit: baseLimit,
      extraUploads: extraUploads,
      planExpiryDate: user?.planExpiryDate,
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
    const usage = await this.getUserMonthlyUsage(userId);

    if (usage.used >= usage.total) {
      throw new Error(
        `Monthly limit of ${usage.total} uploads reached. ${usage.extraUploads > 0 ? "Purchase extra uploads or upgrade plan." : "Upgrade plan or purchase extra uploads."}`,
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
      limit: usage.total,
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

  async addExtraUploads(userId, extraCount, price) {
    const user = await db.users.get(userId);
    if (!user) throw new Error("User not found");

    const currentExtra = user.extraUploads || 0;
    const newExtra = currentExtra + extraCount;

    await db.users.update(userId, { extraUploads: newExtra });

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await db.addOns.add({
      userId,
      extraUploads: extraCount,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      isActive: true,
      price: price,
    });

    await this.logAudit(userId, "EXTRA_UPLOADS_PURCHASED", {
      extraCount: extraCount,
      totalExtra: newExtra,
      price: price,
    });

    return newExtra;
  },

  async getExpiringPlans(daysThreshold = 7) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    const users = await db.users
      .where("planExpiryDate")
      .above(new Date().toISOString())
      .and(
        (user) =>
          user.planExpiryDate && new Date(user.planExpiryDate) <= threshold,
      )
      .toArray();

    return users;
  },

  async getUserDocuments(userId, limit = 50) {
    return await db.documents
      .where("userId")
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async deleteDocument(documentId, userId) {
    const doc = await db.documents.get(documentId);
    if (!doc || doc.userId !== userId) {
      throw new Error("Document not found or unauthorized");
    }

    await db.analyseResult.where("documentId").equals(documentId).delete();
    await db.reports.where("documentId").equals(documentId).delete();
    await db.documents.delete(documentId);

    await this.logAudit(userId, "DOCUMENT_DELETED", { documentId });
    return true;
  },
};

export default db;
