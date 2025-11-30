"use client";

import Link from "next/link";
import * as Strings from "@/components/ui/strings";

/**
 * SubHeader component for dashboard pages
 * Displays logo and project name as navigation link to dashboard
 */
export const SubHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Logo and App Name */}
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {/* Mock Logo - Replace with actual logo later */}
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RQ</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {Strings.appName}
          </span>
        </Link>
      </div>
    </header>
  );
};

