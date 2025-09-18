import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | UOMBot",
  description: "Sign in to your UOMBot account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
