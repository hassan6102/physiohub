import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "برنامجك العلاجي",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
