"use client"

// Disable TypeScript checking for React imports 
// @ts-ignore - Disable TypeScript errors for React hooks
import React from "react"
import { motion } from "framer-motion"
import type { Validator } from "@/lib/types"

// Type for position data
interface Position {
  x: number;
  y: number;
}

interface NetworkVisualizationProps {
  validators: Validator[]
  currentLeaderIndex: number
  onClick?: (validator: Validator) => void
}

export function NetworkVisualization({ 
  validators = [], // Default to empty array to prevent undefined errors
  currentLeaderIndex, 
  onClick 
}: NetworkVisualizationProps) {
  // @ts-ignore - Disabling TypeScript errors for React hooks
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  // @ts-ignore - Disabling TypeScript errors for React hooks
  const [positions, setPositions] = React.useState<Position[]>([])
  
  // Create a stable reference to validators using a ref
  // @ts-ignore - Disabling TypeScript errors for React hooks
  const validatorsRef = React.useRef<Validator[]>(validators)
  
  // Ensure validators is always an array
  const safeValidators = Array.isArray(validators) ? validators : []
  
  // @ts-ignore - Disabling TypeScript errors for React hooks
  React.useEffect(() => {
    // Update the ref when validators change
    validatorsRef.current = safeValidators
  }, [safeValidators])
  
  // @ts-ignore - Disabling TypeScript errors for React hooks
  React.useEffect(() => {
    if (!containerRef.current) return
    
    // Use clientWidth/clientHeight as dependencies to recalculate positions when container size changes
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    
    // Arrange validators in a circle
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const radius = Math.min(centerX, centerY) - 60 // Radius with padding
    
    // Only create new positions if the container size or validator count changes
    const currentValidators = validatorsRef.current
    const newPositions = currentValidators.map((_: any, index: number) => {
      const angle = (index / currentValidators.length) * 2 * Math.PI
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })
    
    // Use object equality check to prevent unnecessary state updates
    const positionsChanged = newPositions.length !== positions.length || 
      newPositions.some((pos: Position, i: number) => 
        !positions[i] || pos.x !== positions[i].x || pos.y !== positions[i].y
      )
    
    if (positionsChanged) {
      setPositions(newPositions)
    }
  }, [containerRef.current?.clientWidth, containerRef.current?.clientHeight])
  
  // Calculate center position - using a simple calculation instead of useMemo to avoid TS errors
  const centerX = containerRef.current?.clientWidth ? containerRef.current.clientWidth / 2 : 0
  const centerY = containerRef.current?.clientHeight ? containerRef.current.clientHeight / 2 : 0
  const centerPosition = { x: centerX, y: centerY }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden" style={{ height: '400px' }}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Network Visualization
        </h2>
      </div>
      
      <div 
        ref={containerRef} 
        className="relative w-full h-full p-4 bg-gray-50 dark:bg-gray-800"
      >
        {/* Center "hub" */}
        <div 
          className="absolute rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 flex items-center justify-center"
          style={{ 
            width: '80px', 
            height: '80px',
            left: centerPosition.x - 40,
            top: centerPosition.y - 40,
            zIndex: 1
          }}
        >
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Verafy</span>
        </div>
        
        {/* Validator nodes */}
        {safeValidators.map((validator, index) => {
          const isLeader = index === currentLeaderIndex
          
          if (!positions[index]) return null
          
          return (
            <motion.div
              key={validator.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: positions[index].x - 30, 
                y: positions[index].y - 30
              }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1
              }}
              onClick={() => onClick?.(validator)}
              className={`absolute cursor-pointer rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
                isLeader 
                  ? 'bg-gradient-to-br from-amber-300 to-amber-500 dark:from-amber-500 dark:to-amber-700 border-2 border-amber-300 dark:border-amber-400 w-[70px] h-[70px] z-20' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 w-[60px] h-[60px] z-10 hover:shadow-xl'
              }`}
            >
              {isLeader && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] rounded-full w-6 h-6 flex items-center justify-center border border-white dark:border-gray-700">
                  👑
                </div>
              )}
              <div className={`font-bold ${isLeader ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                {validator.profileName.split(' ')[0]}
              </div>
              <div className={`text-[10px] ${isLeader ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {validator.provider}
              </div>
            </motion.div>
          )
        })}
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {safeValidators.map((_, index) => {
            if (!positions[index]) return null
            
            return (
              <line
                key={`line-${index}`}
                x1={centerPosition.x}
                y1={centerPosition.y}
                x2={positions[index].x}
                y2={positions[index].y}
                stroke={index === currentLeaderIndex ? "#F59E0B" : "#CBD5E1"}
                strokeWidth={index === currentLeaderIndex ? 2 : 1}
                strokeDasharray={index === currentLeaderIndex ? "none" : "4,4"}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
