"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function QueryInterface() {
  const [payWithWallet, setPayWithWallet] = useState(false)
  const [queryCount, setQueryCount] = useState(4)
  const [question, setQuestion] = useState("")

  const decrementCount = () => {
    if (queryCount > 1) setQueryCount(queryCount - 1)
  }

  const incrementCount = () => {
    setQueryCount(queryCount + 1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-zinc-900 text-4xl font-bold text-center mb-8">How can we help you?</h1>

      <div className="bg-white rounded-3xl shadow-lg p-6 max-w-4xl mx-auto">
        {/* Pay with Wallet Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Switch checked={payWithWallet} onCheckedChange={setPayWithWallet} />
            <span className="font-medium">Pay with Wallet (0.008 SOL)</span>
          </div>
          <button className="text-gray-500">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 placeholder-gray-400"
            placeholder="Ask the validator network a yes/no question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2"
            >
              <span className="rounded-full bg-white w-5 h-5 flex items-center justify-center">
                <span className="text-black text-xs">↻</span>
              </span>
              Fast check
            </Button>

            <div className="flex items-center">
              <Button
                variant="outline"
                className="rounded-full h-10 w-10 p-0 flex items-center justify-center border border-gray-300"
                onClick={decrementCount}
              >
                -
              </Button>
              <div className="w-16 h-10 bg-gray-100 flex items-center justify-center mx-2 rounded-md">{queryCount}</div>
              <Button
                variant="outline"
                className="rounded-full h-10 w-10 p-0 flex items-center justify-center border border-gray-300"
                onClick={incrementCount}
              >
                +
              </Button>
            </div>

            <span className="text-gray-500">AI will be queried</span>
          </div>

          <Button className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2">
            Submit
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Queries left</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">6</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Cost to query: ({queryCount})</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">$0.10</span>
          </div>

          <Button
            variant="outline"
            className="rounded-full border border-gray-200 px-4 py-1 text-gray-700 hover:bg-gray-50"
          >
            Stake to get more
          </Button>
        </div>
      </div>

      {/* Footer Text */}
      <p className="text-center text-gray-700 mt-6 max-w-4xl mx-auto">
        Submit Questions to the network intelligence, <span className="font-medium">(187)</span> will compete to
        respond.
      </p>
      <p className="text-center text-gray-700 max-w-4xl mx-auto">
      Stake to unlock more queries and earn <span className="font-medium">11%</span> yield
      </p>


    </div>
  )
}
