import VerafyAsk from "@/app/ask/ask-form";
import { TopNav } from "./top-nav";

export default function Ask() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        {/* <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4"> */}
        <VerafyAsk availableQueries={37} />
        {/* </main> */}
      </div>
    </div>
  );
}
