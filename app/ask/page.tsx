// app/ask/page.tsx
import { TopNav } from './top-nav';
import AskForm from './ask-form';

export default function Ask() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <AskForm />
      </div>
    </div>
  );
}