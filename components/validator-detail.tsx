"use client"

// Fixing React imports
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Validator } from "@/lib/types"

interface ValidatorDetailProps {
  validator: Validator | null
  isLeader: boolean
  onClose: () => void
}

export function ValidatorDetail({ validator, isLeader, onClose }: ValidatorDetailProps) {
  const [activeTab, setActiveTab] = React.useState<"info" | "votes">("info")

  if (!validator) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isLeader
                  ? 'bg-gradient-to-br from-amber-300 to-amber-500 dark:from-amber-500 dark:to-amber-700'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {isLeader ? (
                  <span className="text-xl">👑</span>
                ) : (
                  <span className="text-xl">🔍</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {validator.profileName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {validator.provider} {isLeader && '• Current Leader'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "info"
                    ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Validator Info
              </button>
              <button
                onClick={() => setActiveTab("votes")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "votes"
                    ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Vote History
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Public Key</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {validator.publicKey}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Validator ID</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                    {validator.id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${isLeader ? 'bg-green-500' : 'bg-blue-500'} mr-2`}></span>
                    <span className="text-sm text-gray-900 dark:text-gray-200">
                      {isLeader ? 'Active (Leader)' : 'Active'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voting Style</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                    LLM-based analysis
                  </p>
                </div>
              </div>
            )}

            {activeTab === "votes" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recent votes and rationales from this validator:
                </p>

                <div className="space-y-3">
                  {/* This would be populated with actual vote history */}
                  {[1, 2, 3].map((_, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate max-w-[70%]">
                          Is AI development progressing too quickly?
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          index % 2 === 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {index % 2 === 0 ? 'YES' : 'NO'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {index % 2 === 0
                          ? "After analyzing the query, I believe AI development is indeed progressing at a rate that outpaces regulatory frameworks and ethical considerations."
                          : "Based on my analysis, AI development is proceeding at an appropriate pace with sufficient guardrails and ethical considerations in place."}
                      </p>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
