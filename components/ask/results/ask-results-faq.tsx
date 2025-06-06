"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { motion } from "framer-motion";
// import Link from "next/link";
import { cn } from "@/lib/utils";
import { JSX } from "react";

// Define FAQ item type
interface FAQItem {
  question: string;
  answer: JSX.Element | string;
}

// FAQ data structured for easy maintenance
const faqData: FAQItem[] = [
  {
    question: "How do I submit a query?",
    answer: (
      <>
        <ol className="list-decimal pl-5 mt-2">
          <li>Go to the Ask section.</li>
          <li>Enter your question or select a query type (e.g., fact-check, predict, create, or shop).</li>
          <li>Submit the query, which will deduct credits from your balance.</li>
          <li>View results, including AI consensus and validator responses.</li>
        </ol>
      </>
    ),
  },
  {
    question: "What types of queries can I submit?",
    answer: (
      <>
        You can submit queries in the following modes:
        <ul className="list-disc pl-5 mt-2">
          <li><strong>Fact-Check</strong>: Verify the accuracy of a statement.</li>
          <li><strong>Predict</strong>: Get predictions based on your query.</li>
          <li><strong>Create</strong>: Generate creative content or ideas.</li>
          <li><strong>Shop</strong>: Explore product-related queries or recommendations.</li>
        </ul>
      </>
    ),
  },
  {
    question: "What are credits, and how do I use them?",
    answer:
      "Credits are used to submit queries to the platform’s AI network for answers, fact-checking, predictions, or other tasks. Each query consumes a set number of credits, and your total credits (free + paid) are displayed on the Credits page.",
  },
  {
    question: "How do I check my query results?",
    answer: (
      <>
        After submitting a query:
        <ul className="list-disc pl-5 mt-2">
          <li>Visit the  Ask section to view recent queries.</li>
          <li>Click on a query card to see detailed results, including consensus (Yes/No or No Consensus), validator responses, and rationale.</li>
          <li>In Expert mode, you can access additional details like network visualizations and vote history.</li>
        </ul>
      </>
    ),
  },
  {
    question: "What does 'consensus' mean in the results?",
    answer:
      "Consensus indicates whether the AI validators agree on an answer. If reached, it shows as 'Yes' or 'No' based on the majority vote. If no consensus is reached, it means validators did not agree on a single answer.",
  },
  {
    question: "What is Expert mode?",
    answer:
      "Expert mode provides a detailed view of query results, including network visualizations, validator vote history, and staking charts. To access it, toggle the view mode in the 'Ask' section.",
  },
  {
    question: "Who are the validators?",
    answer: (
      <>
        Validators are AI models (e.g., from providers like OpenAI, Anthropic, or HuggingFace) that process your queries. Each validator provides a vote (Yes/No) and a rationale. You can view their profiles and responses in the query results or the Validators section.
      </>
    ),
  },
  {
    question: "How can I favorite a query?",
    answer: (
      <>
        To favorite a query:
        <ul className="list-disc pl-5 mt-2">
          <li>Click the star icon on a query card in the  Ask section.</li>
          <li>Favorited queries can be filtered using the star icon in the layout toggle.</li>
          <li>View all favorited queries in your profile under the Favorites section.</li>
        </ul>
      </>
    ),
  },
  {
    question: "How do I share my query results?",
    answer: (
      <>
        To share a query:
        <ul className="list-disc pl-5 mt-2">
          <li>Click the Twitter icon to share a link to the query on X.</li>
          <li>Click the Copy icon to copy the query link to your clipboard.</li>
          <li>Click the Sticky Note icon to view the full query report page, which can also be shared.</li>
        </ul>
      </>
    ),
  },
  {
    question: "How do I provide feedback on a query result?",
    answer: (
      <>
        To provide feedback:
        <ul className="list-disc pl-5 mt-2">
          <li>Click the feedback link on a query card in the  Ask section.</li>
          <li>Fill out the feedback form with your rating (thumbs up/down), explanation, and any specific issues (e.g., slow response, error).</li>
          <li>Submit the form to help improve the platform.</li>
        </ul>
      </>
    ),
  },
  {
    question: "What happens if no validators respond to my query?",
    answer:
      "If no validators respond, your query may show 'No validator responses available.' You can retry submitting the query or contact support via the feedback form if the issue persists.",
  },
  {
    question: "How is the rationale for a query result chosen?",
    answer:
      "The rationale displayed is the longest one from a validator whose vote matches the consensus (if reached). It’s sourced from a validator’s profile and provider for transparency.",
  },
  {
    question: "Can I view past queries?",
    answer:
      "Yes, the 'Ask' section shows your recent queries. You can also view favorited queries in your profile or filter them using the star icon in the layout toggle.",
  },
  {
    question: "Is my data secure when submitting queries?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>Query data is processed securely and sanitized to prevent issues like XSS attacks.</li>
          <li>User data, such as wallet public keys and emails, is protected per our privacy policy.</li>
          <li>Always ensure your wallet is secure and avoid sharing private keys.</li>
        </ul>
      </>
    ),
  },
  {
    question: "Where can I get support?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>Check the  Ask and Credits pages for guidance.</li>
          <li>Submit questions or issues via the feedback form in the Leaders or Feedback section.</li>
          <li>For persistent issues, include details like query ID or error messages in your feedback.</li>
        </ul>
      </>
    ),
  },
];

export default function QueryFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm"
    >
      <h2 className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-6">
        Frequently Asked Questions
      </h2>
      <Accordion.Root
        type="single"
        defaultValue="query-1"
        collapsible
        className="space-y-2"
      >
        <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-4">
          Query and Results
        </h3>
        {faqData.slice(0, 10).map((item, index) => (
          <Accordion.Item
            key={`query-${index}`}
            value={`query-${index + 1}`}
            className="border-b border-zinc-200 dark:border-zinc-700"
          >
            <Accordion.Header>
              <Accordion.Trigger
                className={cn(
                  "flex w-full items-center justify-between py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className="h-4 w-4 transition-transform duration-200 [data-state=open]:rotate-180"
                  aria-hidden
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content
              className={cn(
                "overflow-hidden text-sm text-zinc-600 dark:text-zinc-400",
                "data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up"
              )}
            >
              <div className="py-3">{item.answer}</div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
        <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mt-6 mb-4">
          Other Information
        </h3>
        {faqData.slice(10).map((item, index) => (
          <Accordion.Item
            key={`other-${index}`}
            value={`other-${index + 1}`}
            className="border-b border-zinc-200 dark:border-zinc-700"
          >
            <Accordion.Header>
              <Accordion.Trigger
                className={cn(
                  "flex w-full items-center justify-between py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className="h-4 w-4 transition-transform duration-200 [data-state=open]:rotate-180"
                  aria-hidden
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content
              className={cn(
                "overflow-hidden text-sm text-zinc-600 dark:text-zinc-400",
                "data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up"
              )}
            >
              <div className="py-3">{item.answer}</div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </motion.div>
  );
}

// Add custom animations for accordion content
const styles = `
  @keyframes slideDown {
    from { height: 0; }
    to { height: var(--radix-accordion-content-height); }
  }
  @keyframes slideUp {
    from { height: var(--radix-accordion-content-height); }
    to { height: 0; }
  }
  .animate-slide-down {
    animation: slideDown 300ms ease-out;
  }
  .animate-slide-up {
    animation: slideUp 300ms ease-out;
  }
`;

// Add styles to document head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}