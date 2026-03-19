import type { Metadata } from "next";
import CreateProfileForm from "@/components/ui/CreateProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Remember Someone",
  description:
    "Create a permanent, free memorial profile. Add their name, story, and the places that mattered. No cost, no ads — forever.",
};

export default function CreatePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <p className="text-[#C4A869] small-caps mb-2">Add to the record</p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#E7E0D5]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Remember Someone
        </h1>
        <p className="text-[#A8A29E] mt-3 leading-relaxed">
          Their profile will be permanent and free. Fill in as much or as little as you know —
          you can always come back to add more.
        </p>
      </div>

      <CreateProfileForm />
    </div>
  );
}
