-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voteSessionId" TEXT NOT NULL,
    CONSTRAINT "Thread_voteSessionId_fkey" FOREIGN KEY ("voteSessionId") REFERENCES "VoteSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("body", "createdAt", "id", "title", "updatedAt", "upvotes", "voteSessionId") SELECT "body", "createdAt", "id", "title", "updatedAt", "upvotes", "voteSessionId" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
