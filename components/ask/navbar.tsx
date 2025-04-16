"use client"

import { useState } from "react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [mode, setMode] = useState<"standard" | "expert">("standard")
  const [theme, setTheme] = useState(false)

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-black">VERAFY</span>
            <span className="text-xl font-normal text-teal-500 ml-2">SWARM EXPLORER</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-teal-500">
            Home
          </Link>
          <Link href="/how-it-works" className="text-gray-700 hover:text-teal-500">
            How it works
          </Link>
          <Link href="/become-validator" className="text-gray-700 hover:text-teal-500">
            Become a validator
          </Link>
          <Link href="/stake" className="text-gray-700 hover:text-teal-500">
            Stake
          </Link>
        </div>

        {/* Right Side - Theme Toggle, Login, Connect Wallet */}
        <div className="flex items-center space-x-4">
          <Switch checked={theme} onCheckedChange={setTheme} className="data-[state=checked]:bg-gray-200" />

          <Link href="/login" className="text-gray-800 font-medium">
            Login
          </Link>

          <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-4 py-2">Connect to Wallet</Button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="container mx-auto px-4 flex justify-center mt-2">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setMode("standard")}
            className={`px-4 py-1 rounded-full text-sm ${mode === "standard" ? "bg-white shadow-sm" : "text-gray-500"}`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode("expert")}
            className={`px-4 py-1 rounded-full text-sm ${mode === "expert" ? "bg-white shadow-sm" : "text-gray-500"}`}
          >
            Expert
          </button>
        </div>
      </div>
    </div>
  )
}
