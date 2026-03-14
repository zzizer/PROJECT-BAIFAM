"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";

interface TopBarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="h-16 bg-white border-0 flex items-center shadow-sm">
      {/* Left Section — Logo and collapse toggle */}
      <div
        className={`${isCollapsed ? "w-16" : "w-64"} flex items-center justify-between px-4 border-b border-slate-100 h-full transition-all duration-300`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Icon
              icon="hugeicons:fingerprint-scan"
              className="text-xl text-primary-foreground"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-800 truncate">
                AccessPi
              </h2>
              <p className="text-xs text-slate-500 truncate">Access Control</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-2"
      >
        <Icon
          icon={isCollapsed ? "hugeicons:menu-03" : "hugeicons:menu-collapse"}
          className="text-xl text-slate-600"
        />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section — Status, actions, profile */}
      <div className="flex items-center gap-3 px-6">
        {/* Device status pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs text-slate-600 font-medium">
            Main Entrance
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Icon
            icon="hugeicons:notification-02"
            className="text-xl text-slate-600"
          />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-1.5 pr-2 transition-colors"
          >
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-semibold text-sm">
                AD
              </span>
            </div>
            <Icon
              icon="hugeicons:arrow-down-01"
              className="text-base text-slate-600"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-800">Admin</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Device Administrator
                </p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                <Icon
                  icon="hugeicons:user-03"
                  className="text-lg text-slate-600"
                />
                <span className="text-sm text-slate-700">My Profile</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                <Icon
                  icon="hugeicons:setting-07"
                  className="text-lg text-slate-600"
                />
                <span className="text-sm text-slate-700">Settings</span>
              </button>

              <div className="border-t border-slate-200 my-1" />

              <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-red-600">
                <Icon icon="hugeicons:logout-square-01" className="text-lg" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
