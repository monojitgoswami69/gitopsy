"use client";

import React from "react";
import Image from "next/image";
import { SubjectProfile, DeveloperClassification } from "@/types/domain";
import {
  MapPin,
  Building,
  Users,
  ExternalLink,
} from "lucide-react";

interface SubjectHeaderProps {
  subject: SubjectProfile;
  primaryClassification?: DeveloperClassification;
  showRepoScope?: boolean;
  contributedRepos?: number;
}

export function SubjectHeader({
  subject,
  primaryClassification,
  showRepoScope = false,
  contributedRepos,
}: SubjectHeaderProps) {
  const memberSince = new Date(subject.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const ownedPublic = subject.ownedPublicRepos ?? subject.publicRepos;
  const ownedPrivate = subject.ownedPrivateRepos ?? subject.totalPrivateRepos;
  const ownedRepos = subject.ownedReposCount ?? (ownedPublic + ownedPrivate);
  const accessibleRepos =
    subject.accessibleReposCount ??
    Math.max(ownedRepos, subject.publicRepos + subject.totalPrivateRepos);

  return (
    <div id="section-subject" className="w-full flex flex-col items-center justify-center text-black">
      {/* Profile & Identity Block (Image on Left, details on right) */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center justify-center gap-4 sm:gap-6 text-center sm:text-left">
        {/* Left: Avatar sized to match text column height */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="size-24 sm:size-32 md:size-36 rounded-[14px] sm:rounded-[16px] border-[3.5px] border-black overflow-hidden bg-[#FFDC58] relative">
            <Image
              src={subject.avatarUrl}
              alt={subject.login}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Faint Vertical Divider fading out at top and bottom */}
        <div
          aria-hidden="true"
          className="hidden sm:block w-[1.5px] self-stretch bg-gradient-to-b from-transparent via-black/25 to-transparent mx-1"
        />

        {/* Right: Info, Handle, Bio & Meta */}
        <div className="flex flex-col items-center sm:items-start gap-2 max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 justify-center sm:justify-start">
            <a
              href={`https://github.com/${subject.login}`}
              target="_blank"
              rel="noreferrer"
              className="order-1 sm:order-2 text-xs sm:text-sm font-mono font-bold text-gray-800 hover:text-black flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2 sm:px-2.5 py-0.5 border border-black rounded shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {subject.login} <ExternalLink className="size-3" />
            </a>
            <h1 className="order-2 sm:order-1 text-xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
              {subject.name || subject.login}
            </h1>
          </div>

          {subject.bio ? (
            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed max-w-3xl">
              &ldquo;{subject.bio}&rdquo;
            </p>
          ) : (
            <p className="text-xs font-semibold text-gray-500 italic">No public bio provided.</p>
          )}

          {/* Profile Meta Chips */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 sm:gap-x-5 gap-y-1.5 text-[11px] sm:text-xs font-bold text-gray-700">
            {subject.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-gray-500" /> {subject.location}
              </span>
            )}
            {subject.company && (
              <span className="flex items-center gap-1">
                <Building className="size-3 text-gray-500" /> {subject.company}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3 text-gray-500" /> {subject.followers} followers • {subject.following} following
            </span>
            <span>Member since {memberSince}</span>
          </div>

          {/* Repository Scope Pill (Report View Only) */}
          {showRepoScope && (
            <div className="flex items-center justify-center sm:justify-start mt-1">
              <div className="bg-white border-[2.5px] border-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold shadow-[2px_2px_0_0_#000] flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center sm:justify-start text-black">
                <span>
                  <strong className="font-black">
                    {contributedRepos !== undefined ? contributedRepos : accessibleRepos}
                  </strong>{" "}
                  Contributed Repos
                </span>
                <span className="text-gray-400">|</span>
                <span><strong className="font-black">{ownedRepos}</strong> Owned</span>
                <span className="text-gray-400">|</span>
                <span><strong className="font-black">{ownedPublic}</strong> Public</span>
                <span className="text-gray-400">|</span>
                <span><strong className="font-black">{ownedPrivate}</strong> Private</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
