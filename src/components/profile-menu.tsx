"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function ProfileMenu({
  fullName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = fullName.trim() || email;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative ml-auto shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1.5 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-zinc-800"
      >
        <Avatar name={displayName} size="md" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-zinc-700 sm:block dark:text-zinc-200">
          {displayName}
        </span>
        <span className="sr-only">Open profile menu</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3 dark:border-zinc-800">
            <Avatar name={displayName} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
              <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{role}</p>
            </div>
          </div>
          <Link
            href="/reset-password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Change password
          </Link>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </div>
      )}
    </div>
  );
}
