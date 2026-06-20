-- CreateEnum
CREATE TYPE "HeroButtonTarget" AS ENUM ('SELF', 'BLANK');

-- CreateEnum
CREATE TYPE "HeroTextColor" AS ENUM ('LIGHT', 'DARK');

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "buttonTarget" "HeroButtonTarget" NOT NULL DEFAULT 'SELF',
    "textColor" "HeroTextColor" NOT NULL DEFAULT 'LIGHT',
    "duration" INTEGER NOT NULL DEFAULT 5,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_slides_active_priority_idx" ON "hero_slides"("active", "priority");

-- CreateIndex
CREATE INDEX "hero_slides_startsAt_endsAt_idx" ON "hero_slides"("startsAt", "endsAt");
