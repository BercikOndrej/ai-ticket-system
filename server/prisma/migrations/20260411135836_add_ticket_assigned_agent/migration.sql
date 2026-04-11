-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "assignedToAgentId" TEXT;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assignedToAgentId_fkey" FOREIGN KEY ("assignedToAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
