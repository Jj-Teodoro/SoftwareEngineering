import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

// Page numbers to show: always the first and last, the current page and one on each side,
// with "…" for the gaps, e.g. 1 … 4 5 6 … 84.
function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/**
 * Paging state for a list. Goes back to page 1 when `resetKey` changes (a new search or
 * filter) and never points past the last page when the list shrinks.
 */
export function usePagination(items, { initialPageSize = 10, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [resetKey, pageSize]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const current = Math.min(page, totalPages);
  return {
    page: current,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: items.length,
    pageItems: items.slice((current - 1) * pageSize, current * pageSize),
  };
}

const ARROW =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-gold/50 hover:text-white disabled:pointer-events-none disabled:opacity-30";

/**
 * "Showing 11–20 of 832", rows per page, and page buttons with first / previous / next / last.
 * On phones the numbers fold into "Page 2 of 84".
 */
export default function Pagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  totalItems,
  itemLabel = "items",
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);
  const go = (n) => setPage(Math.min(totalPages, Math.max(1, n)));

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col items-center justify-between gap-3 text-sm sm:flex-row ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white/60">
        <p>
          Showing <span className="font-mono text-white">{from}–{to}</span> of{" "}
          <span className="font-mono text-white">{totalItems}</span> {itemLabel}
        </p>
        {setPageSize && (
          <label className="flex items-center gap-2">
            <span className="text-xs">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-white focus:border-gold/60 focus:outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n} className="bg-[#1c1011]">
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={`${ARROW} hidden sm:inline-flex`} onClick={() => go(1)} disabled={page === 1} aria-label="First page">
            <FiChevronsLeft size={15} />
          </button>
          <button type="button" className={ARROW} onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page">
            <FiChevronLeft size={15} />
          </button>

          <span className="px-3 font-mono text-xs text-white/70 sm:hidden">
            Page {page} of {totalPages}
          </span>
          <div className="hidden items-center gap-1 sm:flex">
            {pageList(page, totalPages).map((n) =>
              typeof n === "string" ? (
                <span key={n} className="w-6 text-center text-white/40" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => go(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg px-2 font-mono text-xs transition ${
                    n === page
                      ? "bg-gold font-bold text-black shadow-[0_0_12px_rgba(242,180,0,0.35)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              )
            )}
          </div>

          <button type="button" className={ARROW} onClick={() => go(page + 1)} disabled={page === totalPages} aria-label="Next page">
            <FiChevronRight size={15} />
          </button>
          <button type="button" className={`${ARROW} hidden sm:inline-flex`} onClick={() => go(totalPages)} disabled={page === totalPages} aria-label="Last page">
            <FiChevronsRight size={15} />
          </button>
        </div>
      )}
    </nav>
  );
}
