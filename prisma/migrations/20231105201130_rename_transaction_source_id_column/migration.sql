/*
  Warnings:

  - You are about to drop the column `sourceTransactionId` on the `pendingTransactionApprovals` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source_transaction_id]` on the table `pendingTransactionApprovals` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `source_transaction_id` to the `pendingTransactionApprovals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pendingTransactionApprovals" DROP CONSTRAINT "pendingTransactionApprovals_sourceTransactionId_fkey";

-- DropIndex
DROP INDEX "pendingTransactionApprovals_sourceTransactionId_key";

-- AlterTable
ALTER TABLE "pendingTransactionApprovals" DROP COLUMN "sourceTransactionId",
ADD COLUMN     "source_transaction_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pendingTransactionApprovals_source_transaction_id_key" ON "pendingTransactionApprovals"("source_transaction_id");

-- AddForeignKey
ALTER TABLE "pendingTransactionApprovals" ADD CONSTRAINT "pendingTransactionApprovals_source_transaction_id_fkey" FOREIGN KEY ("source_transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
