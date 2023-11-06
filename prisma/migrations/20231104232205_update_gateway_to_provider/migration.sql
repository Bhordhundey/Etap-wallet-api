/*
  Warnings:

  - You are about to drop the column `gateway` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "gateway",
ADD COLUMN     "payment_provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK';
