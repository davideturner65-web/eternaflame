"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/search", label: "Search" },
    { href: "/discover", label: "Discover" },
    { href: "/create", label: "Remember Someone" },
  ];

  return (
    <header className="border-b border-[rgba(196,164,105,0.15)] bg-[#1C1917]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl leading-none">🔥</span>
          <div className="flex items-baseline gap-1">
            <span
              className="text-xl text-[#E7E0D5] group-hover:text-[#C4A869] transition-colors duration-200"
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}
            >
              Eternaflame
            </span>
            <span
              className="text-xs text-[#C4A869] font-bold tracking-widest uppercase"
              style={{ fontSize: "0.6rem" }}
            >
              .org
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors duration-200 ${
                pathname === link.href
                  ? "text-[#C4A869]"
                  : "text-[#A8A29E] hover:text-[#E7E0D5]"
              } ${link.href === "/create" ? "!text-[#E7E0D5] px-4 py-1.5 rounded-button border border-[rgba(196,164,105,0.4)] hover:border-[#C4A869] hover:!text-[#C4A869] transition-all" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex sm:hidden items-center gap-4">
          <Link href="/search" className="text-[#A8A29E] hover:text-[#E7E0D5] text-sm">
            Search
          </Link>
          <Link
            href="/create"
            className="text-[#E7E0D5] px-3 py-1.5 text-sm rounded-button border border-[rgba(196,164,105,0.4)] hover:border-[#C4A869]"
          >
            Remember
          </Link>
        </nav>
      </div>
    </header>
  );
}
