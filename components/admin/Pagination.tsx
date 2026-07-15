import Link from "next/link";

/**
 * Paginação compartilhada do admin (QW7).
 *
 * Server component puro: recebe o total, a página atual e uma função
 * que monta o href de cada página preservando filtros/ordenação na
 * querystring. Usado em /admin/produtos e /admin/pedidos.
 */
interface PaginationProps {
  total: number;      // total de itens (já filtrados)
  page: number;       // página atual (1-based)
  perPage: number;
  hrefFor: (page: number) => string;
  labelSingular: string; // "produto" | "pedido"
  labelPlural: string;   // "produtos" | "pedidos"
}

export default function Pagination({
  total,
  page,
  perPage,
  hrefFor,
  labelSingular,
  labelPlural,
}: PaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  // Janela de páginas: 1 … c-1 c c+1 … N
  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => {
    if (pages[pages.length - 1] !== p) pages.push(p);
  };
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) {
      push(p);
    } else if (pages[pages.length - 1] !== "…") {
      push("…");
    }
  }

  return (
    <div className="px-4 py-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-neutral-600">
        Mostrando{" "}
        <span className="font-medium text-neutral-900">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium text-neutral-900">{total}</span>{" "}
        {total === 1 ? labelSingular : labelPlural}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginação">
          {current > 1 ? (
            <Link
              href={hrefFor(current - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              ‹ Anterior
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-sm rounded-lg border border-neutral-100 text-neutral-300 select-none">
              ‹ Anterior
            </span>
          )}

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-2 text-neutral-400 select-none">
                …
              </span>
            ) : p === current ? (
              <span
                key={p}
                aria-current="page"
                className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white font-medium"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={hrefFor(p)}
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              >
                {p}
              </Link>
            )
          )}

          {current < totalPages ? (
            <Link
              href={hrefFor(current + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              Próxima ›
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-sm rounded-lg border border-neutral-100 text-neutral-300 select-none">
              Próxima ›
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
