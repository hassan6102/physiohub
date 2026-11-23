import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold text-primary">PhysioHub</span>
        </Link>
        <div className="card animate-fade-up space-y-5 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
