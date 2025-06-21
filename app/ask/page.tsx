import Navbar from "@/components/ask/navbar/navbar";
import QueryInterface from "@/components/ask/query/query-interface";
import { SolanaProvider } from "@/components/solana-provider";
import AskFooter from "@/components/ask/ask-footer";
import { FeedbackWidget } from "@/components/feedback-widget";
import { FeedbackModal } from "@/components/feedback-modal";

export default async function AskPage() {
  return (
    <SolanaProvider>
      <main
        className="min-h-screen bg-background"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <QueryInterface />
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