"use client";

import React from 'react';
import { BeatLoader, ClipLoader, PulseLoader, RingLoader } from 'react-spinners';

type LoaderType = 'beat' | 'clip' | 'pulse' | 'ring';

interface LoadingSpinnerProps {
  type?: LoaderType;
  message?: string;
  color?: string;
  size?: number;
}

export const LoadingSpinner = ({
  type = 'beat',
  message = 'Loading...',
  color = '#14b8a6',
  size = 15,
}: LoadingSpinnerProps) => {
  const renderLoader = () => {
    switch (type) {
      case 'beat':
        return <BeatLoader color={color} size={size} />;
      case 'clip':
        return <ClipLoader color={color} size={size} />;
      case 'pulse':
        return <PulseLoader color={color} size={size / 2} />;
      case 'ring':
        return <RingLoader color={color} size={size * 2} />;
      default:
        return <BeatLoader color={color} size={size} />;
    }
  };

  return (
    <div className="w-full flex justify-center items-center py-8">
      <div className="flex justify-center items-center mr-2">
        {renderLoader()}
      </div>
      {message && <div className="text-lg font-light">{message}</div>}
    </div>
  );
};
