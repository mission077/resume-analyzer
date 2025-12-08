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
        {/* App Name */}
        <Link 
          href="/dashboard" 
          className="hover:opacity-80 transition-opacity"
        >
          <span className="text-xl font-bold text-gray-900">
            {Strings.appName}
          </span>
        </Link>
      </div>
    </header>
  );
};

