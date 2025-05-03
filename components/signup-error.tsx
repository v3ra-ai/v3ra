"use client";

import { useSearchParams } from "next/navigation";

export default function SignupError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return <p className="text-red-500 mb-4 text-center">{decodeURIComponent(error)}</p>;
}