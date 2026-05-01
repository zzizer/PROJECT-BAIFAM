"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { TIMEZONE_GROUPS } from "./timezones";

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const query = search.toLowerCase();
  const filtered = TIMEZONE_GROUPS.map((group) => ({
    ...group,
    zones: group.zones.filter((tz) => tz.toLowerCase().includes(query)),
  })).filter((group) => group.zones.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white text-slate-800 hover:border-slate-300 transition-colors"
      >
        <span className="truncate">{value || "Select timezone…"}</span>
        <Icon
          icon="hugeicons:arrow-down-01"
          className={`ml-2 shrink-0 text-slate-400 transition-transform text-base ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
              <Icon
                icon="hugeicons:search-01"
                className="text-slate-400 text-sm shrink-0"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search timezones…"
                className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Icon icon="hugeicons:cancel-01" className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">
                No timezones match "{search}"
              </p>
            ) : (
              filtered.map((group) => (
                <div key={group.region}>
                  {/* Region header */}
                  <div className="sticky top-0 px-3 py-1 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {group.region}
                    </span>
                  </div>
                  {group.zones.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => {
                        onChange(tz);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        tz === value
                          ? "bg-primary/5 text-primary font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {tz}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
