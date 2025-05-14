"use client";

import { useSearchParams } from "next/navigation";

export default function SignupError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  const decodedError = decodeURIComponent(error);

  // Handle NEXT_REDIRECT or generic redirect errors
  if (decodedError.includes("NEXT_REDIRECT") || decodedError.includes("Failed to redirect")) {
    return (
      <p className="flex flex-col text-green-700 dark:text-green-300 mb-4 text-center text-sm sm:text-base">
        <span className="">Processing signup. Check your email for the verification link.</span>
        <span className="">After that, you log in with your email.</span>
      </p>

    );
  }

  // Handle rate-limiting error
  if (decodedError.includes("wait 60 seconds")) {
    return (
      <p className="text-red-500 mb-4 text-center text-sm sm:text-base">
        {decodedError} <br />
        Please check your email for the verification code or wait before trying again.
      </p>
    );
  }

  // Default error
  return (
    <p className="text-red-500 mb-4 text-center text-sm sm:text-base">
      {decodedError}
    </p>
  );
}