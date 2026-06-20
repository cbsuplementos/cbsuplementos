"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";

type Slide = {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  buttonTarget: "SELF" | "BLANK";
  textColor: "LIGHT" | "DARK";
  duration: number;
};

interface HeroCarouselProps {
  slides: Slide[];
}

/**
 * HeroCarousel — Client Component
 *
 * Mobile-first desde o primeiro breakpoint.
 * Todas as medidas pensadas para tela de 360px-414px primeiro,
 * depois escalam para desktop.
 *
 * Features:
 * - Timer por slide (configurável no admin)
 * - Indicadores de progresso (bolinhas)
 * - Navegação por setas (desktop)
 * - Swipe touch (mobile)
 * - Pausa no hover/touch
 * - Placeholder elegante sem slides
 */
export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const hasSlides = slides.length > 0;
  const hasMultiple = slides.length > 1;

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Timer automático — usa a duração do slide atual
  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    const duration = (slides[current]?.duration ?? 5) * 1000;
    const timer = setTimeout(goNext, duration);
    return () => clearTimeout(timer);
  }, [current, isPaused, hasMultiple, slides, goNext]);

  // Swipe touch para mobile
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  }

  // Sem slides — placeholder usando a logo completa da marca
  if (!hasSlides) {
    return (
      <section className="relative w-full min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] bg-noir flex items-center justify-center overflow-hidden py-12">
        {/* Decoração de fundo — leves halos dourados */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(212,162,76,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(212,162,76,0.12) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />

        <div className="relative text-center px-6 max-w-3xl mx-auto">
          {/* Logo completa (com slogan e corredor embutidos) */}
          <Logo
            variant="full"
            priority
            className="w-full max-w-md sm:max-w-lg lg:max-w-2xl h-auto mx-auto"
          />

          {/* CTA */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/produtos" className="btn-primary">
              Ver Produtos
            </Link>
            <Link href="/sobre" className="btn-outline">
              Sobre Nós
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];
  const textClasses =
    slide.textColor === "DARK" ? "text-noir" : "text-white";
  const isExternal =
    slide.buttonUrl?.startsWith("http") ||
    slide.buttonUrl?.startsWith("wa.me");

  return (
    <section
      className="relative w-full h-[75vh] sm:h-[80vh] lg:h-[90vh] overflow-hidden bg-noir"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ============ IMAGENS ============ */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`
            absolute inset-0 transition-opacity duration-700
            ${i === current ? "opacity-100" : "opacity-0"}
          `}
        >
          <Image
            src={s.image}
            alt={s.title ?? "CB Suplementos"}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* ============ OVERLAY ============ */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/30 to-transparent"
        aria-hidden="true"
      />

      {/* ============ CONTEÚDO ============ */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-20 lg:pb-24 px-5 sm:px-8 text-center">
        {slide.title && (
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-gold mb-3 sm:mb-4">
            Suplementação Premium
          </p>
        )}

        {slide.title && (
          <h1
            className={`
              font-display leading-tight mb-3 sm:mb-4
              text-3xl sm:text-5xl lg:text-7xl
              ${textClasses}
            `}
          >
            {slide.title}
          </h1>
        )}

        {slide.subtitle && (
          <p
            className={`
              text-sm sm:text-base lg:text-lg
              max-w-xs sm:max-w-md lg:max-w-xl
              leading-relaxed mb-6 sm:mb-8
              ${slide.textColor === "DARK" ? "text-noir/80" : "text-white/80"}
            `}
          >
            {slide.subtitle}
          </p>
        )}

        {slide.buttonText && slide.buttonUrl && (
          isExternal || slide.buttonTarget === "BLANK" ? (
            <a
              href={slide.buttonUrl}
              target={slide.buttonTarget === "BLANK" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-gold text-noir text-xs uppercase tracking-widest hover:bg-gold-light transition-colors duration-300"
            >
              {slide.buttonText}
            </a>
          ) : (
            <Link
              href={slide.buttonUrl}
              className="inline-block px-8 py-3 bg-gold text-noir text-xs uppercase tracking-widest hover:bg-gold-light transition-colors duration-300"
            >
              {slide.buttonText}
            </Link>
          )
        )}
      </div>

      {/* ============ SETAS (desktop only) ============ */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-noir/40 text-white hover:bg-noir/70 transition-colors"
            aria-label="Slide anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-noir/40 text-white hover:bg-noir/70 transition-colors"
            aria-label="Próximo slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* ============ INDICADORES ============ */}
      {hasMultiple && (
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`
                rounded-full transition-all duration-300
                ${i === current
                  ? "w-6 h-2 bg-gold"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}
