export default function CurrentQuery() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">Current Query</h3>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500">Query details placeholder</span>
      </div>
    </div>
  )
}