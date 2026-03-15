"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

interface SubItem {
  label: string;
  href?: string;
  subItems?: SubItem[];
}

interface MenuItem {
  label: string;
  icon: string;
  href?: string;
  subItems?: SubItem[];
}

function useIsActive(href?: string) {
  const pathname = usePathname();
  if (!href) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function hasActiveDescendant(
  items: SubItem[] | undefined,
  pathname: string,
): boolean {
  if (!items) return false;
  return items.some(
    (item) =>
      (item.href && pathname.startsWith(item.href)) ||
      hasActiveDescendant(item.subItems, pathname),
  );
}

interface SubItemProps {
  item: SubItem;
  level: number;
}

const SidebarSubItem: React.FC<SubItemProps> = ({ item, level }) => {
  const pathname = usePathname();
  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const hasChildren = !!item.subItems?.length;
  const [open, setOpen] = useState(() =>
    hasActiveDescendant(item.subItems, pathname),
  );

  const indent = 16 + level * 20;
  const lineLeft = 20 + (level - 1) * 20;

  const sharedClassName = `
    w-full flex items-center justify-between py-2 text-sm transition-all duration-200 rounded-xl
    ${
      isActive
        ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover"
        : "text-foreground hover:bg-muted"
    }
  `;

  const content = (
    <>
      <span>{item.label}</span>
      {hasChildren && (
        <Icon
          icon={open ? "hugeicons:arrow-down-01" : "hugeicons:arrow-right-01"}
          className="text-base shrink-0"
        />
      )}
    </>
  );

  return (
    <div className="w-full py-0.5 relative">
      {/* Vertical guide line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-border"
        style={{ left: `${lineLeft}px` }}
      />

      {hasChildren ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className={sharedClassName}
          style={{
            paddingLeft: `${indent}px`,
            paddingRight: "16px",
            marginLeft: "8px",
            marginRight: "8px",
            width: "calc(100% - 16px)",
          }}
        >
          {content}
        </button>
      ) : (
        <Link
          href={item.href ?? "#"}
          className={sharedClassName}
          style={{
            paddingLeft: `${indent}px`,
            paddingRight: "16px",
            marginLeft: "8px",
            marginRight: "8px",
            width: "calc(100% - 16px)",
            display: "flex",
          }}
        >
          {content}
        </Link>
      )}

      {hasChildren && open && (
        <div className="mt-1">
          {item.subItems!.map((child, idx) => (
            <SidebarSubItem key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface MenuItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const SidebarMenuItem: React.FC<MenuItemProps> = ({
  item,
  isCollapsed,
  isOpen,
  onToggle,
}) => {
  const isActive = useIsActive(item.href);
  const hasChildren = !!item.subItems?.length;

  // ── Collapsed mode: icon-only with tooltip ──
  if (isCollapsed) {
    return (
      <div className="w-full py-0.5 px-2">
        <div className="relative group">
          {hasChildren ? (
            <button
              onClick={onToggle}
              className={`w-full flex items-center justify-center p-3 transition-all duration-200 rounded-sm ${
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon icon={item.icon} className="text-2xl" />
            </button>
          ) : (
            <Link
              href={item.href ?? "#"}
              className={`w-full flex items-center justify-center p-3 transition-all duration-200 rounded-sm ${
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon icon={item.icon} className="text-2xl" />
            </Link>
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
            {item.label}
          </div>
        </div>
      </div>
    );
  }

  const sharedRowClass = `
    w-full flex items-center justify-between px-4 py-2.5 text-sm
    transition-all duration-200 rounded-xl
    ${
      isActive
        ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover"
        : "text-foreground hover:bg-muted"
    }
  `;

  const rowContent = (
    <>
      <div className="flex items-center gap-3">
        <Icon icon={item.icon} className="text-xl shrink-0" />
        <span>{item.label}</span>
      </div>
      {hasChildren && (
        <Icon
          icon={isOpen ? "hugeicons:arrow-down-01" : "hugeicons:arrow-right-01"}
          className="text-base"
        />
      )}
    </>
  );

  return (
    <div className="w-full py-0.5 px-2">
      {hasChildren ? (
        <button onClick={onToggle} className={sharedRowClass}>
          {rowContent}
        </button>
      ) : (
        <Link href={item.href ?? "#"} className={sharedRowClass}>
          {rowContent}
        </Link>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.subItems!.map((sub, idx) => (
            <SidebarSubItem key={idx} item={sub} level={1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "hugeicons:dashboard-browsing",
    href: "/dashboard",
  },
  {
    label: "Fingerprints",
    icon: "hugeicons:fingerprint-scan",
    href: "/fingerprints",
  },
  {
    label: "Personnel",
    icon: "hugeicons:user-group",
    subItems: [
      { label: "Roles", href: "/roles" },
      { label: "Departments", href: "/departments" },
      { label: "Staff", href: "/staff" },
    ],
  },
  {
    label: "Access Logs",
    icon: "hugeicons:time-schedule",
    href: "/access-logs",
  },
  {
    label: "Settings",
    icon: "hugeicons:setting-07",
    href: "/settings",
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();

  // Initialise the open group to whichever top-level item owns the current URL
  const defaultOpen = menuItems.findIndex(
    (item) =>
      (item.href && pathname.startsWith(item.href)) ||
      hasActiveDescendant(item.subItems, pathname),
  );

  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen >= 0 ? defaultOpen : null,
  );

  const handleToggle = (idx: number) =>
    setOpenIndex((prev) => (prev === idx ? null : idx));

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-card transition-all duration-300 flex flex-col`}
    >
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item, idx) => (
          <SidebarMenuItem
            key={idx}
            item={item}
            isCollapsed={isCollapsed}
            isOpen={openIndex === idx}
            onToggle={() => handleToggle(idx)}
          />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
