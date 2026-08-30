"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function HeaderNav() {
  const { isAuthenticated, username, avatarUrl, profile, disconnect, checkSession, fetchProfile } =
    useAuthStore();

  useEffect(() => {
    checkSession().then((tok) => {
      if (tok && (!username || !profile)) {
        fetchProfile();
      }
    });
  }, [checkSession, fetchProfile, username, profile]);

  const handleDisconnect = async () => {
    await disconnect();
    window.location.href = "/";
  };

  const displayUsername = username || profile?.login || profile?.name;
  const displayAvatar =
    avatarUrl ||
    profile?.avatarUrl ||
    (displayUsername ? `https://github.com/${displayUsername}.png` : "/favicon/favicon-32x32.png");

  return (
    <header className="w-full shrink-0 z-40 border-b-[3px] border-black bg-[#F4EFE6]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 shadow-[0_3px_0_0_#000] flex items-center justify-between relative">
      {/* Logo & Tagline */}
      <Link href="/" className="flex items-center gap-2 sm:gap-2.5 select-none group z-10">
        <div className="relative size-8 sm:size-9 shrink-0 group-hover:scale-105 transition-transform">
          <Image
            src="/gitopsy-logo.png"
            alt="Gitopsy Logo"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-black uppercase tracking-tight text-black leading-none">
            GITOPSY
          </span>
          <span className="text-[10px] font-bold text-gray-600 hidden lg:inline mt-0.5">
            YOUR GITHUB, UNDER EXAMINATION
          </span>
        </div>
      </Link>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 z-10">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Leftmost: Leave / Disconnect icon */}
            <button
              onClick={handleDisconnect}
              title="Disconnect session"
              className="text-[#DC2626] hover:text-red-700 hover:scale-110 active:scale-95 transition-all p-0 flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Disconnect session"
            >
              <LogOut className="size-4.5 sm:size-5.5 stroke-[2.5]" />
            </button>

            {/* Profile Name directly on page */}
            {displayUsername && (
              <span className="text-xs sm:text-sm font-mono font-black text-black select-none tracking-tight leading-none max-w-[90px] xs:max-w-[150px] sm:max-w-none truncate">
                {displayUsername}
              </span>
            )}

            {/* Absolute Right: Profile Picture */}
            <div className="relative size-8 sm:size-8.5 shrink-0 overflow-hidden rounded-full border-2 border-black bg-white">
              <img
                src={displayAvatar}
                alt={displayUsername || "User avatar"}
                className="size-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/api/auth/login">
              <Button size="sm" variant="main">
                CONNECT GITHUB
              </Button>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
