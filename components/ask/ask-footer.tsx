"use client";

import React from 'react';
import QueryStoreDebugPanel from './debug/query-store-debug';



export function AskFooter() {
  return (
    <footer className="w-full bg-gray-100 dark:bg-gray-900">
      {/* Full width row */}
      <div className="w-full py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <QueryStoreDebugPanel />
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} TRUTH. All rights reserved.
          </p>
        </div>
      </div>

      {/* Three column row */}
      <div className="w-full py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Our Mission</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Team</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Careers</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Help Center</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AskFooter