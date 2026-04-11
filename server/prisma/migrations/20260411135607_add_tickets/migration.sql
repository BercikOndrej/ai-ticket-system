-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "TicketClassification" AS ENUM ('GeneralQuestion', 'TechnicalQuestion', 'Request', 'Refund');

-- CreateTable
CREATE TABLE "ticket" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'Open',
    "classification" "TicketClassification",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);
