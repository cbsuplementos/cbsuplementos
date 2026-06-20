import Image from "next/image";
import Link from "next/link";

/**
 * Logo — Componente unificado para exibir a logomarca CB Suplementos.
 *
 * Escolhe a variante mais adequada ao contexto:
 *
 * - "full":       Logo completa (músculos + CB + SUPLEMENTOS + slogan + corredor)
 *                 → Hero principal, OG image, página Sobre, splash screens.
 *
 * - "horizontal": Músculos + CB + SUPLEMENTOS (sem o slogan/corredor).
 *                 → Footer, áreas com largura média.
 *
 * - "compact":    Apenas músculos + letras CB (sem texto).
 *                 → Header (mobile e desktop), barras estreitas.
 *
 * - "wordmark":   Apenas CB + SUPLEMENTOS (sem músculos).
 *                 → Barras horizontais bem estreitas (ex: faixa de promoção).
 *
 * - "icon":       Apenas letras CB.
 *                 → Favicon, ícones de app, miniaturas, avatares.
 *
 * Todos os PNGs são servidos via next/image (otimização automática para
 * WebP/AVIF, lazy loading inteligente, sizes responsivo).
 *
 * Use `priority` quando a logo aparece acima da dobra (Header, Hero).
 *
 * Use `asLink` para envolver automaticamente em um Link para a home.
 */

type LogoVariant = "full" | "horizontal" | "compact" | "wordmark" | "icon";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
  asLink?: boolean;
  /** Texto alternativo personalizado (default: "CB Suplementos") */
  alt?: string;
}

const VARIANTS: Record<LogoVariant, { src: string; width: number; height: number }> = {
  full:       { src: "/logo/cb-full.png",       width: 1536, height: 942 },
  horizontal: { src: "/logo/cb-horizontal.png", width: 1256, height: 495 },
  compact:    { src: "/logo/cb-compact.png",    width: 1176, height: 380 },
  wordmark:   { src: "/logo/cb-wordmark.png",   width: 1036, height: 390 },
  icon:       { src: "/logo/cb-icon.png",       width: 580,  height: 280 },
};

export default function Logo({
  variant = "compact",
  className = "",
  priority = false,
  asLink = false,
  alt = "CB Suplementos",
}: LogoProps) {
  const v = VARIANTS[variant];

  const image = (
    <Image
      src={v.src}
      alt={alt}
      width={v.width}
      height={v.height}
      priority={priority}
      className={className}
      sizes={
        variant === "full"
          ? "(max-width: 768px) 90vw, 800px"
          : variant === "horizontal"
          ? "(max-width: 768px) 80vw, 500px"
          : variant === "compact"
          ? "(max-width: 768px) 50vw, 320px"
          : variant === "wordmark"
          ? "(max-width: 768px) 70vw, 420px"
          : "(max-width: 768px) 80px, 120px"
      }
    />
  );

  if (asLink) {
    return (
      <Link href="/" aria-label="CB Suplementos — Página inicial" className="inline-block">
        {image}
      </Link>
    );
  }

  return image;
}
