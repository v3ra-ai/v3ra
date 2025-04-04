import React from "react"
import { Validator } from "@/lib/types"
import Image from "next/image"

interface ValidatorProfileProps {
  validator: Validator | null
  isOpen: boolean
  onClose: () => void
}

export function ValidatorProfile({ validator, isOpen, onClose }: ValidatorProfileProps) {
  if (!isOpen || !validator) return null

  // Create reliability color based on score
  const getReliabilityColor = (score?: number) => {
    if (!score) return { text: "text-gray-500", bg: "bg-gray-100" }
    if (score >= 95) return { text: "text-green-700", bg: "bg-green-50" }
    if (score >= 90) return { text: "text-blue-700", bg: "bg-blue-50" }
    if (score >= 80) return { text: "text-yellow-700", bg: "bg-yellow-50" }
    return { text: "text-orange-700", bg: "bg-orange-50" }
  }

  const reliabilityColor = getReliabilityColor(validator.reliability)

  // Prevent event bubbling
  const handleContentClick = (e: any) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all"
        onClick={handleContentClick}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header with image */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-white flex items-center justify-center">
              {validator.avatarUrl ? (
                <Image 
                  src={validator.avatarUrl} 
                  alt={validator.profileName} 
                  width={128} 
                  height={128} 
                  className="object-cover"
                />
              ) : (
                <div className="text-5xl font-bold text-gray-300">{validator.profileName.charAt(0)}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="pt-20 pb-8 px-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{validator.profileName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {validator.provider} {validator.modelName ? `• ${validator.modelName}` : ""}
            </p>
          </div>
          
          {/* Validator Type Badge - Apple-style elegant pill */}
          {validator.validatorType && (
            <div className="mx-auto max-w-fit mb-6 text-center">
              <div className="px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {validator.validatorType}
                </p>
              </div>
            </div>
          )}
          
          {validator.reliability && (
            <div className="flex justify-center mt-3 mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${reliabilityColor.bg} ${reliabilityColor.text}`}>
                <span className="mr-1">Reliability</span>
                <span className="font-bold">{validator.reliability}%</span>
              </div>
            </div>
          )}
          
          {validator.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {validator.description}
              </p>
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Stats</h3>
            
            <div className="flex justify-between items-center border-b pb-2 border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Last Vote</span>
              <span className={`text-sm font-medium ${
                validator.lastVote === true 
                  ? "text-green-600 dark:text-green-400" 
                  : validator.lastVote === false 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-gray-600 dark:text-gray-400"
              }`}>
                {validator.lastVote === true 
                  ? "Yes" 
                  : validator.lastVote === false 
                    ? "No" 
                    : "N/A"}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2 border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Leadership Status</span>
              <span className={`text-sm font-medium ${
                validator.isLeader 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {validator.isLeader ? "Leader" : "Member"}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2 border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Public Key</span>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                {validator.publicKey}
              </span>
            </div>
          </div>
          
          {validator.lastRationale && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Reasoning</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm italic text-gray-600 dark:text-gray-300">
                  "{validator.lastRationale}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
