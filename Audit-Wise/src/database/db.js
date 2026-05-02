import Dexie from "dexie";

export const db = new Dexie("AuditWiseDB");

export const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  business: 200,
};

db.version(1).stores({
  users:
    "++id, email, password, name, fullName, phone, company, position, location, bio, avatar, securitySettings, plan, planUpdatedAt, planExpiryDate, monthlyUploadCount, monthlyResetDate, createdAt, lastLogin, isActive, extraUploads",
  auth: "id, isLoggedIn, userId, tabId, lastActive, sessionToken",
  documents:
    "++id, userId, fileName, fileSize, fileType, filePath, status, scannedAt, originalImage, scannedImage, extractedText, confidence",
  analyseResult:
    "++id, documentId, userId, extractedText, confidence, modelUsed, processedAt, language, analysis, sentiment, riskLevel, keyFindings, recommendations, mode, wordCount, charCount, summary, revenue, expenses, profit, profitMargin, totalCredit, totalDebit, riskScore, anomalies, failedCount, pendingCount, completedCount, transactions",
  reports:
    "++id, userId, documentId, reportName, reportType, findings, recommendations, riskScore, generatedAt, format, isShared",
  subscriptions:
    "++id, userId, plan, status, startDate, endDate, autoRenew, paymentId, amount",
  userSettings:
    "++id, userId, theme, notifications, language, timezone, emailAlerts, twoFactorAuth",
  auditLogs: "++id, userId, action, details, ipAddress, timestamp, documentId",
  addOns:
    "++id, userId, extraUploads, purchaseDate, expiryDate, isActive, price",
});

db.version(2)
  .stores({
    users:
      "++id, email, password, name, fullName, phone, company, position, location, bio, avatar, securitySettings, plan, planUpdatedAt, planExpiryDate, monthlyUploadCount, monthlyResetDate, createdAt, lastLogin, isActive, extraUploads, passwordUpdatedAt, updatedAt",
    auth: "id, isLoggedIn, userId, tabId, lastActive, sessionToken",
    documents:
      "++id, userId, fileName, fileSize, fileType, filePath, status, scannedAt, originalImage, scannedImage, extractedText, confidence",
    analyseResult:
      "++id, documentId, userId, extractedText, confidence, modelUsed, processedAt, language, analysis, sentiment, riskLevel, keyFindings, recommendations, mode, wordCount, charCount, summary, revenue, expenses, profit, profitMargin, totalCredit, totalDebit, riskScore, anomalies, failedCount, pendingCount, completedCount, transactions",
    reports:
      "++id, userId, documentId, reportName, reportType, findings, recommendations, riskScore, generatedAt, format, isShared",
    subscriptions:
      "++id, userId, plan, status, startDate, endDate, autoRenew, paymentId, amount",
    userSettings:
      "++id, userId, theme, notifications, language, timezone, emailAlerts, twoFactorAuth",
    auditLogs:
      "++id, userId, action, details, ipAddress, timestamp, documentId",
    addOns:
      "++id, userId, extraUploads, purchaseDate, expiryDate, isActive, price",
  })
  .upgrade(async (trans) => {
    try {
      const users = await trans.table("users").toArray();
      for (const user of users) {
        const updates = {};
        if (user.extraUploads === undefined) {
          updates.extraUploads = 0;
        }
        if (!user.planExpiryDate && user.plan !== "free" && user.plan) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          updates.planExpiryDate = expiryDate.toISOString();
        }
        if (!user.fullName) {
          updates.fullName = user.name || "";
          updates.phone = user.phone || "";
          updates.company = user.company || "";
          updates.position = user.position || "";
          updates.location = user.location || "";
          updates.bio = user.bio || "";
          updates.avatar = user.avatar || null;
          updates.securitySettings = user.securitySettings || {
            twoFactorAuth: false,
            sessionTimeout: "30",
            loginAlerts: true,
          };
          updates.updatedAt = new Date().toISOString();
        }
        if (Object.keys(updates).length > 0) {
          await trans.table("users").update(user.id, updates);
        }
      }
    } catch (error) {
      console.error("Database upgrade failed:", error);
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
      fullName: userData.name || "",
      phone: "",
      company: "",
      position: "",
      location: "",
      bio: "",
      avatar: null,
      securitySettings: {
        twoFactorAuth: false,
        sessionTimeout: "30",
        loginAlerts: true,
      },
      updatedAt: now.toISOString(),
    });
    return id;
  },

  async getUserByEmail(email) {
    if (!email) return null;
    return await db.users.where("email").equals(email.toLowerCase()).first();
  },

  async checkAndResetMonthlyCount(userId) {
    if (!userId) return 0;
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
    if (!userId)
      return {
        used: 0,
        total: 5,
        remaining: 5,
        plan: "free",
        baseLimit: 5,
        extraUploads: 0,
      };

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
    };
  },

  async getCurrentMonthUploadCount(userId) {
    if (!userId) return 0;
    await this.checkAndResetMonthlyCount(userId);
    const user = await db.users.get(userId);
    return user?.monthlyUploadCount || 0;
  },

  async incrementMonthlyUploadCount(userId) {
    if (!userId) return 0;
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
    if (!userId) throw new Error("User ID required");

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
    if (!documentId || !userId)
      throw new Error("Document ID and User ID required");

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
    if (!documentId) return null;
    return await db.analyseResult
      .where("documentId")
      .equals(documentId)
      .first();
  },

  async getAllAnalyseResults(userId) {
    if (!userId) return [];
    return await db.analyseResult
      .where("userId")
      .equals(userId)
      .reverse()
      .toArray();
  },

  async saveReport(userId, documentId, reportData) {
    if (!userId) throw new Error("User ID required");

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
    if (!userId) return;
    await db.auditLogs.add({
      userId,
      action,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ipAddress: "client-side",
    });
  },

  async getUserStats(userId) {
    if (!userId) return { totalDocs: 0, totalReports: 0, recentActivity: [] };

    const [totalDocs, totalReports, recentActivity] = await Promise.all([
      db.documents.where("userId").equals(userId).count(),
      db.reports.where("userId").equals(userId).count(),
      db.auditLogs.where("userId").equals(userId).reverse().limit(5).toArray(),
    ]);
    return { totalDocs, totalReports, recentActivity };
  },

  async getDocumentCount(userId) {
    if (!userId) return 0;
    return await db.documents.where("userId").equals(userId).count();
  },

  async forceResetMonthlyCount(userId) {
    if (!userId) return 0;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    await db.users.update(userId, {
      monthlyUploadCount: 0,
      monthlyResetDate: firstDayOfMonth.toISOString(),
    });
    return 0;
  },

  async addExtraUploads(userId, extraCount, price) {
    if (!userId) throw new Error("User ID required");

    const user = await db.users.get(userId);
    if (!user) throw new Error("User not found");

    const currentExtra = user.extraUploads || 0;
    const newExtra = currentExtra + extraCount;

    await db.users.update(userId, { extraUploads: newExtra });

    await db.addOns.add({
      userId,
      extraUploads: extraCount,
      purchaseDate: new Date().toISOString(),
      expiryDate: null,
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
};

export default db;
