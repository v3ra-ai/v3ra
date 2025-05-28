"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Validator } from "@/lib/types";
import { useValidatorManagementStore } from "@/store/validator-management-store";

interface ValidatorTileProps {
  validator: Validator;
}

export default function ValidatorTile({ validator }: ValidatorTileProps) {
  const { selectedIds, toggleValidator } = useValidatorManagementStore();

  const active = selectedIds.includes(validator.id);

  const handleClick = () => {
    toggleValidator(validator.id);
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClick}
      className={clsx(
        "flex flex-col items-center justify-center rounded-lg shadow-md cursor-pointer select-none w-32 h-32 p-3 transition-colors",
        active
          ? "bg-emerald-600/20 ring-2 ring-emerald-500 dark:ring-emerald-400"
          : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      )}
    >
      <div className="w-full text-center text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
        {validator.profileName}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate w-full text-center">
        {validator.modelName}
      </div>
      <Image
        src={validator.avatarUrl ? `/icons/${validator.avatarUrl}` : "/icons/placeholder.png"}
        alt={validator.profileName}
        width={32}
        height={32}
        className={clsx("object-contain", active ? "" : "grayscale")}
      />
      {validator.reliability !== null && (
        <span className="text-[10px] mt-0.5">
          {Math.round(validator.reliability)}%
        </span>
      )}
    </motion.div>
  );
}
