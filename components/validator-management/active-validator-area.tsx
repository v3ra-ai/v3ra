"use client";

import { useValidatorManagementStore } from "@/store/validator-management-store";
import ValidatorTile from "./validator-tile";
import { motion, AnimatePresence } from "framer-motion";

export default function ActiveValidatorArea() {
  const { active, activateValidator } = useValidatorManagementStore();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    activateValidator(id);
  };

  return (
    <div
      className="relative flex items-center justify-center w-64 h-64 mx-auto my-6 rounded-full bg-gradient-to-br from-zinc-200/60 to-zinc-400/30 dark:from-zinc-800/60 dark:to-zinc-700/40"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Ripple effect visual */}
      <motion.div
        key={active.length} // trigger animation on change
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-sky-500/10 pointer-events-none"
      />

      <div className="flex flex-wrap gap-3 justify-center items-center max-w-[90%] max-h-[90%]">
        <AnimatePresence initial={false}>
          {active.map((v) => (
            <motion.div key={v.id} layout>
              <ValidatorTile validator={v} active={true} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
