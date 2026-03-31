import type { Metadata } from "next";
import EmailGate from "./EmailGate";

export const metadata: Metadata = {
  title: "Verify Your Email | Eternaflame",
  robots: { index: false },
};

export default function EmailPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/create";
  return <EmailGate next={next} />;
}
