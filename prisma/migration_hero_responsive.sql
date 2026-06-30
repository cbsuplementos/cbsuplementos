-- Migration: Hero responsivo (art direction) — CB Suplementos
--
-- Adiciona suporte a imagem mobile separada e posição configurável do
-- conteúdo (título/subtítulo/CTA) sobre o banner do carrossel.
--
-- Idempotente: pode rodar mais de uma vez sem erro. Execute no banco
-- (Railway) ANTES de fazer deploy do código que usa os campos novos.

-- 1. Enum de posição do conteúdo (grade 3x3)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HeroContentPosition') THEN
    CREATE TYPE "HeroContentPosition" AS ENUM (
      'TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT',
      'CENTER_LEFT', 'CENTER_CENTER', 'CENTER_RIGHT',
      'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT'
    );
  END IF;
END$$;

-- 2. Coluna de imagem mobile (opcional — fallback para a desktop quando nula)
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "imageMobile" TEXT;

-- 3. Coluna de posição do conteúdo (default: base centralizada)
ALTER TABLE "hero_slides"
  ADD COLUMN IF NOT EXISTS "contentPosition" "HeroContentPosition" NOT NULL DEFAULT 'BOTTOM_CENTER';
