import React from "react";
import type { ShopResult, Deal } from "@/lib/types";

interface AskResultsShopProps {
  results: ShopResult[] | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function AskResultsShop({
  results,
  isLoading = false,
  error,
}: AskResultsShopProps) {
  if (isLoading) {
    return <p className="text-center">Loading deals...</p>;
  }
  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }
  if (!results || results.length === 0) {
    return <p className="text-center">No deals found.</p>;
  }

  // Deduplicate providers and flatten deals
  const grouped: Record<string, Deal[]> = {};
  for (const { provider, deals } of results) {
    const key = provider.trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(...deals);
  }
  const entries = Object.entries(grouped);

  // If no providers have deals, show a fallback
  if (entries.length === 0) {
    return <p className="text-center">No deals found.</p>;
  }

  return (
    <div className="space-y-6">
      {entries.map(([provider, deals], idx) => (
        <div key={`${provider}-${idx}`}>  {/* unique key per provider group */}
          <h3 className="text-lg font-semibold mb-2">{provider} Deals</h3>
          <ul className="list-disc ml-5 space-y-1">
            {deals.map((deal, dIdx) => (
              <li key={`${provider}-${dIdx}`}>  {/* unique key per deal */}
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  {deal.title} - {deal.price}
                </a>
                <span className="text-sm text-gray-500 ml-2">({deal.source})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
