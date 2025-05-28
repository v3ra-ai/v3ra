-- DropForeignKey
ALTER TABLE "GraphEdge" DROP CONSTRAINT "GraphEdge_validatorId_fkey";

-- DropForeignKey
ALTER TABLE "ValidatorResponse" DROP CONSTRAINT "ValidatorResponse_validatorId_fkey";

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" TEXT NOT NULL DEFAULT 'thumbs_up',
    "explanation" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includeBrowserInfo" BOOLEAN NOT NULL DEFAULT true,
    "browserInfo" JSONB,
    "url" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "ValidatorResponse" ADD CONSTRAINT "ValidatorResponse_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

