import { Suspense } from "react";
import SignupClient from "./signup-client";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated gradient background matching home page */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
      
      <Suspense fallback={<div className="text-white/60 text-center mt-20">Loading...</div>}>
        <SignupClient />
      </Suspense>
    </div>
  );
}