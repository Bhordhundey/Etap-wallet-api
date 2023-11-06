-- CreateTable
CREATE TABLE "pendingTransactionApprovals" (
    "id" TEXT NOT NULL,
    "sourceTransactionId" TEXT NOT NULL,
    "destination_transaction_id" TEXT NOT NULL,
    "status" "TransactionApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendingTransactionApprovals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pendingTransactionApprovals_sourceTransactionId_key" ON "pendingTransactionApprovals"("sourceTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "pendingTransactionApprovals_destination_transaction_id_key" ON "pendingTransactionApprovals"("destination_transaction_id");

-- AddForeignKey
ALTER TABLE "pendingTransactionApprovals" ADD CONSTRAINT "pendingTransactionApprovals_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendingTransactionApprovals" ADD CONSTRAINT "pendingTransactionApprovals_destination_transaction_id_fkey" FOREIGN KEY ("destination_transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
