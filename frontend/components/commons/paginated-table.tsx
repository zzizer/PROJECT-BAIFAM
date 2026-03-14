"use client";

import React from "react";
import { Icon } from "@iconify/react";

// ── Types ──────────────────────────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
  pageSizeOptions?: number[];
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}

export default function PaginatedTable<T extends { id: number | string }>({
  data,
  columns,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  loading = false,
  emptyIcon = "hugeicons:file-search",
  emptyMessage = "No records found",
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: PaginatedTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-0">
      {/* Table */}
      <div className="bg-white rounded-t-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left text-xs font-semibold text-slate-500 px-5 py-3.5 ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map(
                  (_, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col.key} className="px-5 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ),
                )
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="text-center py-16">
                      <Icon
                        icon={emptyIcon}
                        className="text-4xl text-slate-200 mx-auto mb-3"
                      />
                      <p className="text-sm text-slate-400">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-4 ${col.className ?? ""}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination bar */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Left — count + page size */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">
            {total === 0
              ? "No results"
              : `${from}–${to} of ${total.toLocaleString()}`}
          </p>
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right — page controls */}
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="hugeicons:arrow-left-01" className="text-sm" />
          </button>

          {/* Page numbers */}
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-xs text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                disabled={loading}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium border transition-colors disabled:cursor-not-allowed ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="hugeicons:arrow-right-01" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
