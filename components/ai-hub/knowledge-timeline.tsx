"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Wifi, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineModel {
  company: string;
  model: string;
  date: Date | "real-time";
  color: string;
}

export function KnowledgeTimeline({ models }: { models: TimelineModel[] }) {
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      if (a.date === "real-time") return -1;
      if (b.date === "real-time") return 1;
      return b.date.getTime() - a.date.getTime();
    });
  }, [models]);

  const currentDate = new Date();
  const oldestDate = sortedModels
    .filter(m => m.date !== "real-time")
    .reduce((oldest, m) => {
      const date = m.date as Date;
      return date < oldest ? date : oldest;
    }, currentDate);

  const timeSpan = currentDate.getTime() - oldestDate.getTime();

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800/50">
      <h3 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-cyan-400" />
        Knowledge Timeline
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-0 right-0 h-1 bg-zinc-800 rounded-full top-5" />
        
        {/* Current date marker */}
        <div className="absolute right-0 top-0 flex flex-col items-center">
          <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          <span className="text-xs text-cyan-400 mt-2">Today</span>
        </div>
        
        {/* Model markers */}
        {sortedModels.map((model, index) => {
          if (model.date === "real-time") {
            return (
              <motion.div
                key={`${model.company}-${model.model}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="absolute right-0 top-0 flex flex-col items-center"
                style={{ right: "0%" }}
              >
                <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium text-green-400">{model.model}</p>
                  <p className="text-xs text-zinc-500">{model.company}</p>
                </div>
              </motion.div>
            );
          }
          
          const position = ((currentDate.getTime() - model.date.getTime()) / timeSpan) * 90; // Max 90% to leave room
          
          return (
            <motion.div
              key={`${model.company}-${model.model}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="absolute top-0 flex flex-col items-center"
              style={{ right: `${Math.min(position, 85)}%` }}
            >
              <div 
                className={cn("w-2 h-2 rounded-full", model.color)}
                style={{ boxShadow: `0 0 8px ${model.color.includes('green') ? 'rgba(34,197,94,0.5)' : model.color.includes('yellow') ? 'rgba(234,179,8,0.5)' : 'rgba(156,163,175,0.5)'}` }}
              />
              <div className="mt-2 text-center whitespace-nowrap">
                <p className="text-xs font-medium text-zinc-300">{model.model}</p>
                <p className="text-xs text-zinc-500">
                  {model.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </motion.div>
          );
        })}
        
        {/* Spacer for timeline */}
        <div className="h-24" />
      </div>
    </Card>
  );
}