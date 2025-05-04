import AskFooter from "@/components/ask/ask-footer";
import Navbar from "@/components/ask/navbar";

export default function ValidatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="md:mx-[5%] lg:mx-[15%]">{children}</main>
      <AskFooter />
    </div>
  );
}