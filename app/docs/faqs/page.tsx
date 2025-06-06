import AskFooter from "@/components/ask/ask-footer";
import Navbar from "@/components/ask/navbar/navbar";
import QueryFAQ from "@/components/ask/results/ask-results-faq";
import CreditFAQ from "@/components/credits/credit-faq";
import { FeedbackModal } from "@/components/feedback-modal";
import { FeedbackWidget } from "@/components/feedback-widget";
import { SolanaProvider } from "@/components/solana-provider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | Verafy",
  description:
    "Find answers to frequently asked questions about Verafy’s features, credits, and usage.",
};

export default function FAQsPage() {
  // const backgroundImage = useBackgroundImage();
  return (
    <SolanaProvider>
      <main
        className="min-h-screen bg-background"
        style={{
          // backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />

        <div className="min-h-screen bg-background text-foreground">
          {/* Header */}
          <header className="border-b border-border bg-background">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold text-center sm:text-3xl md:text-4xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground sm:text-base">
                Answers to common questions about Verafy
              </p>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <section className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-xl font-semibold sm:text-2xl">Verafy: Frequently Asked Questions</h2>
              <p className="text-lg font-semibold sm:text-md">Payment FAQs, AI Query FAQs</p>
              {/* <p className="text-lg font-semibold sm:text-md">AI Query FAQs</p> */}
              {/* <p className="text-base text-muted-foreground sm:text-lg">
                Add your FAQ components here (e.g., accordion, collapsible
                sections) to answer common user questions about features,
                credits, or usage.
              </p> */}
              {/* Placeholder for FAQ components */}

              <CreditFAQ />
              <QueryFAQ />

            </section>
          </main>
        </div>

        <AskFooter />
        <FeedbackWidget
          component="AskPage"
          action="view"
          className="fixed bottom-5 right-4"
        />
        <FeedbackModal />
      </main>
    </SolanaProvider>
  );
}
