"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Clock,
  FileCode2,
  Scale,
  Layers,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useAutopsyStore } from "@/lib/store/autopsyStore";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const { currentAnalysis } = useAutopsyStore();

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auth_status") === "connected" || urlParams.has("auth_error")) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-14 py-6 max-w-6xl mx-auto text-black">
      {/* ------------------- SECTION 1: HERO ------------------- */}
      <section id="hero" className="flex flex-col items-center text-center pt-6 sm:pt-8 pb-4">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight max-w-5xl leading-[1.08] mb-5 sm:mb-6"
        >
          Your GitHub,{" "}
          <motion.span
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-[#FFDC58] text-black px-3 sm:px-4 py-0.5 sm:py-1 border-[2.5px] sm:border-[3px] border-black shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] inline-block my-1 rounded-xl sm:rounded-2xl"
          >
            forensically examined.
          </motion.span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 max-w-3xl leading-relaxed mb-6 sm:mb-8 px-2"
        >
          A forensic look at the commits, repositories, habits, and patterns hiding in your GitHub history.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4"
        >
          {isAuthenticated ? (
            <Link
              href="/autopsy"
              className="bg-[#FFDC58] text-black border-[2.5px] sm:border-[3px] border-black px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl"
            >
              <span>Visit Console</span>
              <ArrowRight className="size-4 sm:size-5 stroke-[3]" />
            </Link>
          ) : (
            <a
              href="/api/auth/login"
              className="bg-[#FFDC58] text-black border-[2.5px] sm:border-[3px] border-black px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl"
            >
              <Lock className="size-4 sm:size-5" />
              <span>Connect GitHub (PKCE)</span>
              <ArrowRight className="size-4 sm:size-5 stroke-[3]" />
            </a>
          )}
        </motion.div>
      </section>

      {/* ------------------- SECTION 2: HOW IT WORKS ------------------- */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto w-full"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">How It Works</h2>
          <p className="text-xs sm:text-sm text-gray-700 font-bold max-w-xl mx-auto mt-2 px-2">
            Three simple steps from repository history to a complete forensic analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <span className="text-lg sm:text-xl font-mono font-black text-[#CA8A04] shrink-0">
                01
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase">
                Authorize
              </h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Connect your account with read-only GitHub OAuth. No passwords, zero write permissions, and repository data never leaves your browser.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <span className="text-lg sm:text-xl font-mono font-black text-[#DC2626] shrink-0">
                02
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase">
                Audit
              </h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              A background Web Worker processes commit logs, diff churn, timestamps, and message syntax without blocking the UI thread.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <span className="text-lg sm:text-xl font-mono font-black text-[#2563EB] shrink-0">
                03
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase">
                Dossier
              </h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Review your developer archetype, repository awards, commit breakdown, and year-in-review summary.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ------------------- SECTION 3: FEATURE SPECIFICATIONS ------------------- */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto w-full"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">The Forensic Breakdown</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <Clock className="size-5 sm:size-6 text-[#CA8A04] group-hover:scale-110 transition-transform shrink-0 stroke-[2.5]" />
              <h3 className="text-base sm:text-lg font-black uppercase">When the Coding Happens</h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              24-hour clocks, weekday rhythms, streaks, and nocturnal habits logged on your timeline.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <FileCode2 className="size-5 sm:size-6 text-[#2563EB] group-hover:scale-110 transition-transform shrink-0 stroke-[2.5]" />
              <h3 className="text-base sm:text-lg font-black uppercase">The Commit Record &amp; Churn</h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Message patterns, commit size spectrums, additions, deletions, and rewrites.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <Scale className="size-5 sm:size-6 text-[#16A34A] group-hover:scale-110 transition-transform shrink-0 stroke-[2.5]" />
              <h3 className="text-base sm:text-lg font-black uppercase">The Gitopsy Courtroom</h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              A lighthearted tribunal charging you with questionable git hygiene and late-night commits.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-white border-[3px] border-black p-5 sm:p-6 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 rounded-2xl sm:rounded-3xl cursor-default">
            <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
              <Layers className="size-5 sm:size-6 text-[#9333EA] group-hover:scale-110 transition-transform shrink-0 stroke-[2.5]" />
              <h3 className="text-base sm:text-lg font-black uppercase">Language DNA &amp; Archetypes</h3>
            </div>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Multi-language byte distribution, functional dialect breakdowns, and forensic classifications.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ------------------- FOOTER ------------------- */}
      <footer className="max-w-5xl mx-auto w-full text-center mt-6">
        <div className="pt-4 border-t-2 border-black/20 flex items-center justify-between text-xs font-bold uppercase text-gray-700 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-nowrap mx-auto sm:mx-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative size-4 sm:size-5 shrink-0">
                <Image
                  src="/gitopsy-logo.png"
                  alt="Gitopsy Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="whitespace-nowrap">© Gitopsy 2026</span>
            </div>
            <span className="text-black/40">•</span>
            <a
              href="https://github.com/monojitgoswami69/gitopsy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors flex items-center gap-1 hover:underline whitespace-nowrap"
              title="GitHub Repository"
            >
              <svg className="size-3.5 sm:size-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
          <a
            href="#hero"
            onClick={(e) => handleScrollToSection(e, "hero")}
            className="hidden sm:inline-block hover:underline hover:text-black transition-colors"
          >
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
