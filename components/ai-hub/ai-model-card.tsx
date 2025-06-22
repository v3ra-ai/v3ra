"use client";

import { LLM } from "@/store/llm-store";
import { ArrowRight, Cpu, Activity } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getModelIconPath } from "@/lib/utils/icon-mapping";
import { getModelSpecialization } from "@/types/ai-models";

interface AIModelCardProps {
  model: LLM;
  viewMode: "grid" | "list";
}

export default function AIModelCard({ model, viewMode }: AIModelCardProps) {
  const specialization = getModelSpecialization(model.name);

  if (viewMode === "list") {
    return (
      <Link
        href={`/ai-hub/${model.id}/profile`}
        className="group flex items-center gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
            <Image
              src={getModelIconPath(model.name, model.provider, model.avatar)}
              alt={model.name}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100 truncate">{model.name}</h3>
            <span className="text-xs text-zinc-500">by {model.provider}</span>
          </div>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-1">
            {specialization.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {specialization.category}
            </span>
            {model.enabled && (
              <span className="flex items-center gap-1 text-emerald-500">
                <Activity className="w-3 h-3" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </Link>
    );
  }

  return (
    <Link
      href={`/ai-hub/${model.id}/profile`}
      className="group relative rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm flex items-center justify-center">
            <Image
              src={getModelIconPath(model.name, model.provider, model.avatar)}
              alt={model.name}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        {model.enabled && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              <Activity className="w-3 h-3" />
              Active
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate">{model.name}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{model.provider}</p>
        
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 line-clamp-2">
            {specialization.description}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {specialization.strengths.slice(0, 2).map((strength, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs rounded-md bg-zinc-800 text-zinc-400"
            >
              {strength}
            </span>
          ))}
          {specialization.strengths.length > 2 && (
            <span className="px-2 py-1 text-xs rounded-md bg-zinc-800 text-zinc-500">
              +{specialization.strengths.length - 2} more
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-100">
            <span className="text-sm font-medium">View Profile</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
