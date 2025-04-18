
import NetworkVisualization from "./consensus/network-visualization"
import CurrentQuery from "./consensus/current-query"
import NetworkStatus from "./consensus/network-status"
import DeepDive from "./consensus/staking-deep-dive"
import Staking from "./consensus/staking"

export default function ConsensusStatus() {
  return (
    <div className="container rounded-2xl shadow-md mx-auto px-4 py-8 max-w-7xl">
      <h2 className="text-xl text-gray-800 dark:text-zinc-200 mb-6">Consensus Status</h2>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* First row: Network Visualization and Current Query */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NetworkVisualization />
          <CurrentQuery />
        </div>

        {/* Second row: Network Status (full width) */}
        <div>
          <NetworkStatus />
        </div>

        {/* Third row: Deep Dive and Staking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DeepDive />
          <Staking />
        </div>
      </div>
    </div>
  )
}