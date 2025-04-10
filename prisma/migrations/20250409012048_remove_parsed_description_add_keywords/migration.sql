/*
  Warnings:

  - You are about to drop the column `parsedDescription` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "parsedDescription",
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
