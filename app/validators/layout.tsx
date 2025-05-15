"use client";
import AskFooter from "@/components/ask/ask-footer";
import Navbar from "@/components/ask/navbar";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

export default function ValidatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backgroundImage = useBackgroundImage();

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Navbar />
      <main className="md:mx-[5%] lg:mx-[15%]">{children}</main>
      <AskFooter />
    </div>
  );
}
