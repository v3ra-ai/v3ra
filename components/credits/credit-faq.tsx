"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Assuming a utility for className concatenation
import { JSX } from "react";

// Define FAQ item type
interface FAQItem {
  question: string;
  answer: JSX.Element | string;
}

// FAQ data structured for easy maintenance
const faqData: FAQItem[] = [
  {
    question: "What payment methods are available?",
    answer: (
      <>
        You can purchase credits using two cryptocurrencies:
        <ul className="list-disc pl-5 mt-2">
          <li>
            <strong>SOL</strong>: The native cryptocurrency of the Solana blockchain. Use the &quot;Buy Credits with SOL&quot; option to select the number of credits you want and pay with SOL from your connected Solana wallet.
          </li>
          <li>
            <strong>$truth</strong>: A token on the Solana blockchain. Use the &quot;Buy Credits with $truth&quot; option to select credits and pay with $truth tokens from your wallet.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "How do I buy credits with SOL or $truth?",
    answer: (
      <>
        <ol className="list-decimal pl-5 mt-2">
          <li>Connect your Solana wallet by clicking &quot;Connect Wallet&quot; if not already connected.</li>
          <li>Choose either &quot;Buy Credits with SOL&quot; or &quot;Buy Credits with $truth.&quot;</li>
          <li>Use the slider to select the number of credits (1 to 100).</li>
          <li>Check the cost in SOL or $truth and your wallet balance.</li>
          <li>Click &quot;Pay Now&quot; to initiate the transaction. Approve the transaction in your wallet.</li>
          <li>Once confirmed, credits will be added to your account.</li>
        </ol>
      </>
    ),
  },
  {
    question: "What is staking, and how does it work?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>
            <strong>Staking for Rewards</strong>: You can stake SOL with our validator node via{" "}
            <Link
              href="https://stakewiz.com/validator/TrutHUEykD2UsmAq7W3hA4r3XiQxGLqhENAwo9522xa"
              className="text-blue-500 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stakewiz
            </Link>
            . Staked SOL may qualify for rewards, such as additional credits or other promotions, depending on current offers.
          </li>
          <li>
            To stake, click &quot;Stake Now,&quot; follow the link, and stake SOL with the provided validator address. Check the staking section for current staked SOL and reward details.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Do I need a specific wallet?",
    answer:
      "You need a Solana-compatible wallet (e.g., Phantom, Solflare) that supports SOL and $truth tokens. Ensure your wallet is set to the Solana Mainnet and has sufficient SOL for transaction fees (approximately 0.01 SOL per transaction).",
  },
  {
    question: "What are the costs?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>
            <strong>SOL</strong>: The cost is calculated as credits × a fixed SOL rate (displayed during purchase). For example, 10 credits might cost 0.1 SOL.
          </li>
          <li>
            <strong>$truth</strong>: The cost is 1 $truth per credit (e.g., 10 credits = 10 $truth).
          </li>
          <li>Transaction fees in SOL apply for both payment types.</li>
        </ul>
      </>
    ),
  },
  {
    question: "Can I get free credits?",
    answer:
      "Yes, free credits may be awarded upon signup or through promotions. Check the &quot;Free Credits&quot; section in the Credits page to see your current free credit balance.",
  },
  {
    question: "What are credits, and how do I use them?",
    answer:
      "Credits are used to submit queries to the platform’s AI network for answers, fact-checking, or predictions. Each query typically consumes a set number of credits. Your total credits (free + paid) are displayed on the Credits page.",
  },
  {
    question: "How do I check my credit balance?",
    answer: (
      <>
        Visit the Credits page to see your:
        <ul className="list-disc pl-5 mt-2">
          <li>
            <strong>Free Credits</strong>: Credits awarded for free (e.g., signup bonuses).
          </li>
          <li>
            <strong>Paid Credits</strong>: Credits purchased with SOL or $truth.
          </li>
          <li>
            <strong>Total Credits</strong>: The sum of free and paid credits available for use.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "What happens if I don’t have enough SOL or $truth?",
    answer:
      "If your wallet lacks sufficient SOL or $truth, the &quot;Pay Now&quot; button will be disabled, and you’ll see an error message. Add funds to your wallet and ensure you have enough SOL for transaction fees.",
  },
  {
    question: "How do I connect or change my wallet?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>
            To connect, click &quot;Connect Wallet&quot; and select your Solana wallet. Follow your wallet’s prompts to connect.
          </li>
          <li>
            To change wallets, click &quot;Change Wallet&quot; on the Credits page, disconnect the current wallet, and connect a new one.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "What should I do if a transaction fails?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>Ensure your wallet is on the Solana Mainnet.</li>
          <li>Verify you have enough SOL for fees and SOL or $truth for the purchase.</li>
          <li>Check your internet connection and wallet status.</li>
          <li>If issues persist, contact support via the feedback form on the platform.</li>
        </ul>
      </>
    ),
  },
  {
    question: "How do I submit a query?",
    answer: (
      <>
        <ol className="list-decimal pl-5 mt-2">
          <li>Go to the &quot;Ask&quot; section.</li>
          <li>Enter your question or select a query type (e.g., fact-check, predict).</li>
          <li>Submit the query, which will deduct credits from your balance.</li>
          <li>View results, including AI consensus and validator responses.</li>
        </ol>
      </>
    ),
  },
  {
    question: "What is the platform’s purpose?",
    answer:
      "The platform uses a network of AI validators to provide accurate, consensus-driven answers to your questions. It supports queries for general knowledge, fact-checking, predictions, and more, powered by a decentralized network.",
  },
  {
    question: "How do I provide feedback?",
    answer:
      "Use the feedback form in the &quot;Leaders&quot; or &quot;Feedback&quot; section to share suggestions or report issues. Your feedback helps improve the platform.",
  },
  {
    question: "Is my data secure?",
    answer: (
      <>
        <ul className="list-disc pl-5 mt-2">
          <li>Wallet transactions are secured by the Solana blockchain.</li>
          <li>User data is protected per our privacy policy. Only your wallet public key and email (if provided) are used for account management.</li>
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
          <li>Check the Credits and Ask pages for guidance.</li>
          <li>Submit questions or issues via the feedback form.</li>
          <li>For payment issues, ensure your wallet is correctly configured and contact support if needed.</li>
        </ul>
      </>
    ),
  },
];

export default function CreditFAQ() {
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
        defaultValue="payment-1"
        collapsible
        className="space-y-2"
      >
        <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-4">
          Payment Options
        </h3>
        {faqData.slice(0, 6).map((item, index) => (
          <Accordion.Item
            key={`payment-${index}`}
            value={`payment-${index + 1}`}
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
        {faqData.slice(6).map((item, index) => (
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