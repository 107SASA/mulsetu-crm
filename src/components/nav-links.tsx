"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="scroll-thin order-3 -mx-4 flex w-full gap-1 overflow-x-auto border-t border-zinc-100 px-4 pt-2 text-sm sm:order-0 sm:w-auto sm:border-none sm:px-0 sm:pt-0 dark:border-zinc-800">
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors ${
              isActive
                ? "bg-accent-50 font-medium text-accent-700 dark:bg-accent-100/10 dark:text-accent-500"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
