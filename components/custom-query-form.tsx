"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface CustomQueryFormProps {
  onSubmit: (query: string) => Promise<void>
  isOpen: boolean
  onToggle: () => void
}

export function CustomQueryForm({ onSubmit, isOpen, onToggle }: CustomQueryFormProps) {
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(query)
      setQuery("")
    } catch (error) {
      console.error("Error submitting query:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-2"
      >
        <span className="mr-1">{isOpen ? "Hide" : "Show"} validator query</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="custom-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask the validator network a yes/no question
              </label>
              <textarea
                id="custom-query"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Is artificial intelligence beneficial for society?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !query.trim()}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  isSubmitting || !query.trim()
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Broadcasting...
                  </>
                ) : (
                  "Broadcast Query"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
