import type { VoteResult } from "@/lib/types"

interface VoteResultsProps {
  voteResult: VoteResult | null | undefined
}

export function VoteResults({ voteResult }: VoteResultsProps) {
  if (!voteResult) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Latest Vote Results</h3>
        <p className="text-gray-500">No vote results available</p>
      </div>
    )
  }

  // Function to display consensus value, handling ties explicitly
  const getConsensusDisplay = (consensusValue: boolean | null) => {
    if (consensusValue === null) {
      return {
        text: "Tie",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      }
    } else if (consensusValue === true) {
      return {
        text: "Yes",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      }
    } else {
      return {
        text: "No",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }
    }
  }

  // Add extra safety check for all properties
  const consensusValue = voteResult?.consensusValue ?? null
  const consensusDisplay = getConsensusDisplay(consensusValue)
  
  // Safely access voting results with optional chaining
  const votingResult = voteResult?.votingResult || { yes: 0, no: 0, notVoted: 0 }
  const validatorResponses = voteResult?.validatorResponses || []

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Latest Vote Results</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400">Consensus:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${consensusDisplay.className}`}
          >
            {consensusDisplay.text}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400">Query:</span>
          <span className="text-sm font-medium">{voteResult?.queryText || 'Unknown query'}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{votingResult.yes}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Yes Votes</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{votingResult.no}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No Votes</div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{votingResult.notVoted}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Not Voted</div>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Validator Responses</h4>
          <div className="space-y-2">
            {validatorResponses.map((response, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                <div className="flex justify-between">
                  <span className="font-medium">{response?.profileName ?? 'Unknown'} ({response?.provider ?? 'Unknown'})</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    response?.vote === "YES" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {response?.vote}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{response?.rationale ?? 'No rationale provided'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
