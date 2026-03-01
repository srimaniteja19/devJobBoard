"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-7 w-12 animate-pulse bg-edge" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="press inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 text-[12px] font-medium text-bg transition-theme hover:bg-accent-hover"
      >
        <LogIn className="h-3 w-3" />
        <span className="hidden sm:inline">Sign in</span>
        <span className="sm:hidden">In</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {session.user.image ? (
        <img
          src={session.user.image}
          alt={session.user.name ?? "Avatar"}
          className="h-6 w-6 rounded-full border border-[#2a2a2a] sm:h-7 sm:w-7"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2a2a] bg-edge text-[10px] font-medium text-t-muted sm:h-7 sm:w-7 sm:text-[11px]">
          {session.user.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}
      <span className="hidden text-[13px] font-light text-t-muted sm:inline">
        {session.user.name}
      </span>
      <button
        onClick={() => signOut()}
        className="press inline-flex items-center gap-1 border border-edge px-2 py-1 text-[11px] font-light text-t-muted transition-theme hover:border-edge-hover hover:text-t-primary"
      >
        <LogOut className="h-3 w-3" />
        <span className="hidden sm:inline">Out</span>
      </button>
    </div>
  );
}
