-- CreateEnum
CREATE TYPE "ProductBadge" AS ENUM ('NONE', 'MAIS_VENDIDO', 'NOVIDADE', 'PROMOCAO', 'EXCLUSIVO');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "defaultHeight" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "defaultLength" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "defaultWeight" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "defaultWidth" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "badge" "ProductBadge" NOT NULL DEFAULT 'NONE';
