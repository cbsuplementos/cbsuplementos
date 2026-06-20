"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import AccountSidebar from "./AccountSidebar";
import Logo from "@/components/Logo";

const navigation = [
  { name: "Início", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Sobre", href: "/sobre" },
  { name: "Contato", href: "/contato" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { customer, cartCount } = useCart();

  useEffect(() => {
    // Histerese para evitar "flicker" perto do limiar:
    // só encolhe ao passar de 80px, e só volta a crescer abaixo de 20px.
    // Isso cria uma zona morta (20–80px) onde o estado não muda, evitando
    // o loop em que mudar a altura do header reposiciona o scroll e
    // dispara a troca de estado repetidamente.
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled((prev) => {
        if (!prev && y > 80) return true;
        if (prev && y < 20) return false;
        return prev;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`
          sticky top-0 z-40 w-full
          bg-noir/95 backdrop-blur-sm
          border-b border-gold/20
          transition-all duration-300
          ${isScrolled ? "py-2" : "py-3 sm:py-4"}
        `}
      >
        <div className="container-padded">
          <div className="flex items-center justify-between">

            {/* ===== MOBILE LAYOUT ===== */}

            {/* Esquerda mobile: hamburguer + logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gold p-1 -ml-1"
                aria-label="Abrir menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              </button>

              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center"
                aria-label="CB Suplementos — Página inicial"
              >
                <Logo
                  variant="compact"
                  priority
                  className={`w-auto transition-all duration-300 ${
                    isScrolled ? "h-9" : "h-11"
                  }`}
                />
              </Link>
            </div>

            {/* Direita mobile: lupa + carrinho + conta */}
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/produtos" className="text-gold/80 hover:text-gold transition-colors p-1" aria-label="Buscar produtos">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
                </svg>
              </Link>

              <Link href="/carrinho" className="relative text-gold hover:text-gold-light transition-colors p-1" aria-label="Carrinho">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-noir text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Conta — abre sidebar ao invés de navegar */}
              <button
                onClick={() => setIsAccountOpen(true)}
                className="text-gold/80 hover:text-gold transition-colors p-1"
                aria-label={customer ? "Minha conta" : "Entrar"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </button>
            </div>

            {/* ===== DESKTOP LAYOUT ===== */}

            <Link
              href="/"
              className="hidden lg:flex items-center"
              aria-label="CB Suplementos — Página inicial"
            >
              <Logo
                variant="compact"
                priority
                className={`w-auto transition-all duration-300 ${
                  isScrolled ? "h-12" : "h-16"
                }`}
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="
                    relative text-xs uppercase tracking-widest
                    text-white/80 hover:text-gold transition-colors duration-300
                    after:content-[''] after:absolute after:left-0 after:-bottom-1
                    after:h-px after:w-0 after:bg-gold
                    after:transition-all after:duration-300 hover:after:w-full
                  "
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              {/* Conta desktop — também abre sidebar */}
              <button
                onClick={() => setIsAccountOpen(true)}
                className="text-[10px] uppercase tracking-widest text-white/80 hover:text-gold transition-colors cursor-pointer"
              >
                {customer ? customer.name.split(" ")[0] : "Entrar"}
              </button>

              <Link href="/carrinho" className="relative text-gold hover:text-gold-light transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-noir text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* Menu mobile fullscreen */}
      <div className={`
        fixed inset-0 z-50 lg:hidden bg-noir
        transition-opacity duration-300
        ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}>
        <div className="flex flex-col h-full">
          <div className="container-padded py-3 flex items-center justify-between border-b border-gold/20">
            <Logo variant="compact" className="h-9 w-auto" />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gold p-2 -mr-2"
              aria-label="Fechar menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 flex flex-col justify-center container-padded">
            <ul className="space-y-5 text-center">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-display text-2xl sm:text-3xl text-white hover:text-gold transition-colors duration-300"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="container-padded pb-8 space-y-3">
            <Link
              href="/carrinho"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 border border-gold text-gold text-xs uppercase tracking-widest font-medium hover:bg-gold hover:text-noir transition-colors duration-300"
            >
              Carrinho {cartCount > 0 && `(${cartCount})`}
            </Link>
            <button
              onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => setIsAccountOpen(true), 300); }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gold text-noir text-xs uppercase tracking-widest font-medium hover:bg-gold-light transition-colors duration-300"
            >
              {customer ? `Minha Conta` : "Entrar / Cadastrar"}
            </button>
          </div>
        </div>
      </div>

      {/* Account sidebar */}
      <AccountSidebar
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />
    </>
  );
}
