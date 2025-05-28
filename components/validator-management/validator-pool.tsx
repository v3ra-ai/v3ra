"use client";

import { useValidatorManagementStore } from "@/store/validator-management-store";
import { useEffect } from "react";
import ValidatorTile from "./validator-tile";
import { motion, AnimatePresence } from "framer-motion";

interface ValidatorPoolProps {
  initialValidators: Array<Record<string, unknown>>; // Provided from server
}

export default function ValidatorPool({ initialValidators }: ValidatorPoolProps) {
  const { available, initValidators } = useValidatorManagementStore();

  useEffect(() => {
    initValidators(initialValidators);
  }, [initialValidators, initValidators]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // No-op since dropping into pool shouldn't cause activation
  };

  return (
    <div
      className="flex flex-wrap gap-3 p-4 bg-white/40 dark:bg-zinc-900/40 rounded-lg min-h-[120px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <AnimatePresence initial={false}>
        {available.map((v) => (
          <motion.div key={v.id} layout>
            <ValidatorTile validator={v} active={false} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
