"use client";

import { useValidatorManagementStore } from "@/store/validator-management-store";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function OnboardingOverlay() {
  const { onboardingSeen, setOnboardingSeen } = useValidatorManagementStore();

  useEffect(() => {
    if (!onboardingSeen) {
      const timer = setTimeout(() => setOnboardingSeen(), 5000);
      return () => clearTimeout(timer);
    }
  }, [onboardingSeen, setOnboardingSeen]);

  if (onboardingSeen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-zinc-900/70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white dark:bg-zinc-900 rounded-lg p-6 text-center max-w-xs"
      >
        <p className="text-base font-medium mb-4">Drag to add, tap to remove</p>
        {/* simple mock animation illustration */}
        <motion.div
          initial={{ x: -40 }}
          animate={{ x: 40 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-16 h-16 bg-sky-500/20 rounded-lg mx-auto"
        />
        <button
          onClick={setOnboardingSeen}
          className="mt-4 px-4 py-2 text-sm bg-sky-600 text-white rounded-md"
        >
          Skip
        </button>
      </motion.div>
    </motion.div>
  );
}
