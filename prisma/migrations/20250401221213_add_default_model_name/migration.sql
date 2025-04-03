-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Validator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'default-model',
    "publicKey" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "avatarUrl" TEXT,
    "validatorType" TEXT,
    "reliability" REAL DEFAULT 0.0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "correctVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Validator" ("active", "avatarUrl", "correctVotes", "createdAt", "description", "id", "isLeader", "modelName", "profileName", "provider", "publicKey", "reliability", "totalVotes", "updatedAt", "validatorType") SELECT "active", "avatarUrl", "correctVotes", "createdAt", "description", "id", "isLeader", "modelName", "profileName", "provider", "publicKey", "reliability", "totalVotes", "updatedAt", "validatorType" FROM "Validator";
DROP TABLE "Validator";
ALTER TABLE "new_Validator" RENAME TO "Validator";
CREATE INDEX "Validator_provider_idx" ON "Validator"("provider");
CREATE INDEX "Validator_active_idx" ON "Validator"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
