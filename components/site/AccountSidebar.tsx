"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

interface AccountSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AccountSidebar — Painel lateral de conta
 *
 * Slide-in pela direita. Dois estados:
 * - Não logado: convida a entrar/cadastrar
 * - Logado: menu de conta com links rápidos
 *
 * Sempre mostra links de suporte (WhatsApp, endereço, atendimento).
 */
export default function AccountSidebar({ isOpen, onClose }: AccountSidebarProps) {
  const { customer, logout } = useCart();

  // Travar scroll quando aberto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  async function handleLogout() {
    await logout();
    onClose();
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header do sidebar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <span className="font-display text-lg text-neutral-900">Minha Conta</span>
            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            {customer ? (
              /* ========== LOGADO ========== */
              <>
                {/* Avatar + Nome */}
                <div className="px-5 py-6 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                      <span className="text-white font-display text-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{customer.name.split(" ")[0]}</p>
                      <p className="text-xs text-neutral-500">{customer.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu principal */}
                <div className="px-2 py-3">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                    Minha conta
                  </p>

                  <SidebarLink
                    href="/minha-conta/pedidos"
                    onClick={onClose}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    }
                    label="Meus pedidos"
                  />

                  <SidebarLink
                    href="/minha-conta"
                    onClick={onClose}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    }
                    label="Meu perfil"
                  />

                  <SidebarLink
                    href="/minha-conta/enderecos"
                    onClick={onClose}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    }
                    label="Endereços de entrega"
                  />
                </div>

                <div className="border-t border-neutral-100 mx-5" />

                {/* Suporte */}
                <div className="px-2 py-3">
                  <SupportLinks onClose={onClose} />
                </div>

                <div className="border-t border-neutral-100 mx-5" />

                {/* Sair */}
                <div className="px-2 py-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="text-sm font-medium">Sair desta conta</span>
                  </button>
                </div>
              </>
            ) : (
              /* ========== NÃO LOGADO ========== */
              <>
                {/* Avatar + CTA */}
                <div className="px-5 py-8 text-center border-b border-neutral-100">
                  <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Entre ou cadastre-se</h3>
                  <p className="text-sm text-neutral-500 mt-1">Seus pedidos, carrinho, conta...</p>

                  <div className="flex gap-3 mt-6">
                    <Link
                      href="/conta/login"
                      onClick={onClose}
                      className="flex-1 py-3 bg-neutral-900 text-white text-sm font-semibold rounded-lg text-center hover:bg-neutral-800 transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/conta/cadastro"
                      onClick={onClose}
                      className="flex-1 py-3 border border-neutral-900 text-neutral-900 text-sm font-semibold rounded-lg text-center hover:bg-neutral-50 transition-colors"
                    >
                      Criar conta
                    </Link>
                  </div>
                </div>

                {/* Suporte */}
                <div className="px-2 py-3">
                  <SupportLinks onClose={onClose} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== Sub-components ===== */

function SidebarLink({
  href,
  onClick,
  icon,
  label,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function SupportLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* WhatsApp */}
      <a
        href="https://wa.me/559199266197"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
      >
        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm font-medium">WhatsApp</span>
      </a>

      {/* Encontrar loja */}
      <Link
        href="/contato"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
      >
        <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
        <span className="text-sm font-medium">Encontrar loja</span>
      </Link>

      {/* Central de atendimento */}
      <a
        href="https://wa.me/559199266197?text=Ol%C3%A1%2C%20preciso%20de%20ajuda!"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
      >
        <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-sm font-medium">Central de atendimento</span>
      </a>
    </>
  );
}
