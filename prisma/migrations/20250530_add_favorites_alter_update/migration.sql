-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "vote_session_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vote_session_id_fkey" FOREIGN KEY ("vote_session_id") REFERENCES "VoteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

