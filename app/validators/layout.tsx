import Navbar from "@/components/ask/navbar";

export default function ValidatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}