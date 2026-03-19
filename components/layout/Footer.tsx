import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(196,164,105,0.12)] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span
              className="text-[#E7E0D5] font-semibold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Eternaflame
              <span className="text-[#C4A869] text-xs ml-1 tracking-widest uppercase font-bold">.org</span>
            </span>
          </div>

          <p className="text-[#78716C] text-sm text-center sm:text-left">
            An index of every human life. Free forever.
          </p>

          <nav className="flex items-center gap-6 text-sm text-[#78716C]">
            <Link href="/search" className="hover:text-[#A8A29E] transition-colors">
              Search
            </Link>
            <Link href="/discover" className="hover:text-[#A8A29E] transition-colors">
              Discover
            </Link>
            <Link href="/create" className="hover:text-[#A8A29E] transition-colors">
              Remember Someone
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
