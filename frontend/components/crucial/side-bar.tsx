"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface SubItem {
  label: string;
  subItems?: SubItem[];
  active?: boolean;
}

interface MenuItem {
  label: string;
  icon: string;
  active?: boolean;
  subItems?: SubItem[];
}

interface SidebarItemProps {
  item: MenuItem | SubItem;
  level?: number;
  isCollapsed: boolean;
  openItemIndex: number | null;
  currentIndex: number;
  onToggle: (index: number) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  level = 0,
  isCollapsed,
  openItemIndex,
  currentIndex,
  onToggle,
}) => {
  const [openSubIndex, setOpenSubIndex] = useState<number | null>(null);
  const hasChildren = item.subItems && item.subItems.length > 0;
  const menuItem = item as MenuItem;
  const isOpen =
    level === 0 ? openItemIndex === currentIndex : openSubIndex !== null;

  const handleClick = () => {
    if (hasChildren) {
      if (level === 0) {
        onToggle(currentIndex);
      } else {
        setOpenSubIndex(openSubIndex === null ? currentIndex : null);
      }
    }
  };

  if (isCollapsed && level === 0) {
    return (
      <div className="w-full py-0.5 px-2">
        <div className="relative group">
          <button
            className={`w-full flex items-center justify-center p-3 transition-all duration-200 rounded-sm ${
              menuItem.active
                ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon icon={menuItem.icon} className="text-2xl" />
          </button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
            {item.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={level === 0 ? "w-full py-0.5 px-2" : "w-full py-0.5 relative"}
    >
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-border"
          style={{ left: `${20 + (level - 1) * 20}px` }}
        />
      )}
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
          item.active
            ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover"
            : "text-foreground hover:bg-muted"
        }`}
        style={
          level > 0
            ? {
                paddingLeft: `${16 + level * 20}px`,
                marginLeft: "8px",
                marginRight: "8px",
              }
            : {}
        }
      >
        <div className="flex items-center gap-3">
          {level === 0 && menuItem.icon && (
            <Icon icon={menuItem.icon} className="text-xl shrink-0" />
          )}
          <span className="text-sm">{item.label}</span>
        </div>
        {hasChildren && (
          <Icon
            icon={
              isOpen ? "hugeicons:arrow-down-01" : "hugeicons:arrow-right-01"
            }
            className="text-base"
          />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.subItems!.map((subItem, idx) => (
            <SidebarItem
              key={idx}
              item={subItem}
              level={level + 1}
              isCollapsed={false}
              openItemIndex={openSubIndex}
              currentIndex={idx}
              onToggle={setOpenSubIndex}
            />
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

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenItemIndex(openItemIndex === index ? null : index);
  };

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: "hugeicons:dashboard-browsing",
      active: true,
    },
    {
      label: "Fingerprints",
      icon: "hugeicons:fingerprint-scan",
      subItems: [{ label: "Enrolled Fingerprints" }, { label: "Enroll New" }],
    },
    {
      label: "Staff",
      icon: "hugeicons:user-group",
      subItems: [
        { label: "All Staff" },
        { label: "Add Staff" },
        { label: "Departments" },
      ],
    },
    {
      label: "Permissions",
      icon: "hugeicons:shield-key",
      subItems: [{ label: "Access Rules" }, { label: "Schedules" }],
    },
    {
      label: "Access Logs",
      icon: "hugeicons:time-schedule",
      subItems: [{ label: "All Logs" }, { label: "Export Logs" }],
    },
    {
      label: "Settings",
      icon: "hugeicons:setting-07",
    },
  ];

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-64"} bg-card transition-all duration-300 flex flex-col`}
    >
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item, idx) => (
          <SidebarItem
            key={idx}
            item={item}
            isCollapsed={isCollapsed}
            openItemIndex={openItemIndex}
            currentIndex={idx}
            onToggle={handleToggle}
          />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
