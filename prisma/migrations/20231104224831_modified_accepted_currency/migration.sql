/*
  Warnings:

  - The values [GBP,EUR] on the enum `Currency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Currency_new" AS ENUM ('NGN', 'USD', 'GHS', 'ZAR', 'KES');
ALTER TABLE "wallets" ALTER COLUMN "currency" TYPE "Currency_new" USING ("currency"::text::"Currency_new");
ALTER TABLE "transactions" ALTER COLUMN "currency" TYPE "Currency_new" USING ("currency"::text::"Currency_new");
ALTER TYPE "Currency" RENAME TO "Currency_old";
ALTER TYPE "Currency_new" RENAME TO "Currency";
DROP TYPE "Currency_old";
COMMIT;
