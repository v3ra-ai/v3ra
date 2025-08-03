"use client";

import React from "react";
import {
  BeatLoader,
  ClipLoader,
  PulseLoader,
  RingLoader,
  ScaleLoader,
} from "react-spinners";

type LoaderType = "beat" | "clip" | "pulse" | "ring" | "scale";

interface LoadingSpinnerProps {
  type?: LoaderType;
  message?: string;
  color?: string;
  size?: number;
  noWrapper?: boolean; // New prop
}

export const LoadingSpinner = ({
  type = "beat",
  message = "Loading...",
  color = "#a855f7", // Purple from our gradient theme
  size = 15,
  noWrapper = false, // Default to false
}: LoadingSpinnerProps) => {
  const renderLoader = () => {
    switch (type) {
      case "beat":
        return <BeatLoader color={color} size={size} />;
      case "clip":
        return <ClipLoader color={color} size={size} />;
      case "pulse":
        return <PulseLoader color={color} size={size / 2} />;
      case "ring":
        return <RingLoader color={color} size={size * 2} />;
      case "scale":
        return <ScaleLoader color={color} />;
      default:
        return <BeatLoader color={color} size={size} />;
    }
  };

  if (noWrapper) {
    return (
      <>
        {renderLoader()}
        {message && <span className="text-lg font-light text-white/60">{message}</span>}
      </>
    );
  }

  return (
    <div className="w-full flex justify-center items-center py-8">
      <div className="flex justify-center items-center mr-3">
        {renderLoader()}
      </div>
      {message && <div className="text-lg font-light text-white/60">{message}</div>}
    </div>
  );
};