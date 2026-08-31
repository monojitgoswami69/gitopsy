"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Clock,
  Layers,
  Cpu,
  Award,
  Gavel,
  Flame,
  Check,
  Fingerprint,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

// User-friendly FAQ items
const FAQ_ITEMS = [
  {
    question: "Does Gitopsy store my code or tokens on a server?",
    answer:
      "No. Gitopsy runs entirely inside your browser. We do not operate remote databases or cloud servers to store your repositories, code, or login credentials. Everything is computed and stored locally on your own device.",
  },
  {
    question: "Can Gitopsy analyze private repositories?",
    answer:
      "Yes. When connecting with GitHub, Gitopsy requests standard repository access so you can examine both private and public projects. Gitopsy exclusively performs read operations and will never modify your repositories or push any code.",
  },
  {
    question: "What happens if I have a very large GitHub history?",
    answer:
      "Gitopsy automatically paces its requests and saves checkpoints as it analyzes. If GitHub rate limits are reached on large accounts, Gitopsy automatically pauses and preserves your progress, allowing you to resume the analysis later at your disposal.",
  },
  {
    question: "How do I save or delete my analysis?",
    answer:
      "Your analysis is safely stored in your browser so it's ready whenever you return. You can easily download your full report or permanently delete all your data in one click from the console.",
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
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
    <div className="flex flex-col gap-14 sm:gap-20 py-4 sm:py-6 max-w-6xl mx-auto text-black">
      {/* ------------------- SECTION 1: HERO ------------------- */}
      <section id="hero" className="flex flex-col items-center text-center pt-4 sm:pt-8 pb-2">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight max-w-5xl leading-[1.08] mb-4 sm:mb-6"
        >
          Your GitHub,{" "}
          <motion.span
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="bg-[#FFDC58] text-black px-3 sm:px-4 py-0.5 sm:py-1 border-2 border-black shadow-[2.5px_2.5px_0_0_#000] inline-block my-1 rounded-xl sm:rounded-2xl"
          >
            forensically examined.
          </motion.span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 max-w-3xl leading-relaxed mb-6 sm:mb-8 px-2"
        >
          A forensic look at the commits, repositories, habits, and patterns hiding in your GitHub history.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4"
        >
          {isAuthenticated ? (
            <Link
              href="/autopsy"
              className="bg-[#FFDC58] text-black border-2 border-black px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2 sm:gap-2.5 rounded-xl"
            >
              <span>Visit Console</span>
              <ArrowRight className="size-4 sm:size-5 stroke-[2.5]" />
            </Link>
          ) : (
            <a
              href="/api/auth/login"
              className="bg-[#FFDC58] text-black border-2 border-black px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2 sm:gap-2.5 rounded-xl"
            >
              <Lock className="size-4 sm:size-5 stroke-[2.2]" />
              <span>Connect with GitHub</span>
              <ArrowRight className="size-4 sm:size-5 stroke-[2.5]" />
            </a>
          )}
        </motion.div>
      </section>

      {/* ------------------- SECTION 2: ABOUT GITOPSY ------------------- */}
      <section id="about" className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            What Gitopsy Uncovers
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 font-bold max-w-2xl mx-auto mt-2 px-2">
            A comprehensive, data-driven look at your development journey. Discover detailed activity charts, coding archetypes, and repository achievements directly in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Forensic Statistics */}
          <div className="group bg-white border-[3px] border-black p-6 rounded-2xl shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0_0_#000] transition-all flex flex-col justify-between">
            <div>
              <div className="mb-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="size-5 sm:size-5.5 text-amber-500 stroke-[2.5] shrink-0" />
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none">
                    Forensic Statistics
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-gray-600 font-bold block pl-7">
                  Metrics &amp; Timelines
                </span>
              </div>
              <p className="text-xs text-gray-700 font-semibold leading-relaxed mb-4">
                Reveals your 24-hour active hours clock, late-night coding habits, streak consistency, PR merge speeds, and how much code you write versus delete.
              </p>
            </div>
            <div className="border border-black/15 bg-amber-50/60 p-3 rounded-xl flex flex-col gap-1 text-[11px] font-mono font-bold text-gray-700">
              <div className="flex items-start gap-2 text-black">
                <Flame className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">24h Clocks • Code Churn • Streak Analysis</span>
              </div>
            </div>
          </div>

          {/* Card 2: Developer Archetypes */}
          <div className="group bg-white border-[3px] border-black p-6 rounded-2xl shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0_0_#000] transition-all flex flex-col justify-between">
            <div>
              <div className="mb-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="size-5 sm:size-5.5 text-purple-600 stroke-[2.5] shrink-0" />
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none">
                    Developer Archetypes
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-gray-600 font-bold block pl-7">
                  Behavioral Profiles
                </span>
              </div>
              <p className="text-xs text-gray-700 font-semibold leading-relaxed mb-4">
                Discovers your unique developer personality from your real git habits, uncovering your coding archetype, collaboration style, and attention to commit craft.
              </p>
            </div>
            <div className="border border-black/15 bg-purple-50/60 p-3 rounded-xl flex flex-col gap-1 text-[11px] font-mono font-bold text-gray-700">
              <div className="flex items-start gap-2 text-purple-950">
                <Fingerprint className="size-3.5 text-purple-700 shrink-0 mt-0.5" />
                <span className="leading-snug">Personality Profiles • Habit Analysis</span>
              </div>
            </div>
          </div>

          {/* Card 3: Profile & Repository Awards */}
          <div className="group bg-white border-[3px] border-black p-6 rounded-2xl shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0_0_#000] transition-all flex flex-col justify-between">
            <div>
              <div className="mb-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="size-5 sm:size-5.5 text-green-600 stroke-[2.5] shrink-0" />
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none">
                    Gitopsy Awards
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-gray-600 font-bold block pl-7">
                  Profile &amp; Repository Honors
                </span>
              </div>
              <p className="text-xs text-gray-700 font-semibold leading-relaxed mb-4">
                Unlocks distinct honors for your developer profile alongside awards for standout repositories (like <em>The Workhorse</em> and <em>The Monolith</em>) and playful verdicts from the Court of Version Control.
              </p>
            </div>
            <div className="border border-black/15 bg-green-50/60 p-3 rounded-xl flex flex-col gap-1 text-[11px] font-mono font-bold text-gray-700">
              <div className="flex items-start gap-2 text-green-950">
                <Gavel className="size-3.5 text-green-700 shrink-0 mt-0.5" />
                <span className="leading-snug">Profile Trophies • Repo Honors • Court Verdicts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------- SECTION 3: HOW IT WORKS ------------------- */}
      <section id="how-it-works" className="w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 font-bold max-w-xl mx-auto mt-2 px-2">
            Three simple steps from repository history to a complete forensic overview.
          </p>
        </div>

        <div className="border-[3px] border-black bg-white rounded-2xl sm:rounded-3xl shadow-[4px_4px_0_0_#000] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black/10">
            {/* Step 1 */}
            <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="mb-3.5">
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none mb-1">
                    01. Authorize Securely
                  </h3>
                  <span className="text-[11px] font-mono text-gray-600 font-bold block">
                    Connect Account
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                  Connect your GitHub account securely. Gitopsy strictly performs read operations, never modifies your code, and saves nothing to a remote database.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/10 text-[11px] font-mono font-bold text-gray-500 flex items-center gap-1.5">
                <Check className="size-3.5 text-green-700 stroke-[3] shrink-0" />
                <span>Zero write operations • 100% private</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="mb-3.5">
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none mb-1">
                    02. Automatic Analysis
                  </h3>
                  <span className="text-[11px] font-mono text-gray-600 font-bold block">
                    In-Browser Processing
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                  Your commit history, code changes, active hours, and collaboration patterns are computed completely inside your browser in seconds.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/10 text-[11px] font-mono font-bold text-gray-500 flex items-center gap-1.5">
                <Check className="size-3.5 text-green-700 stroke-[3] shrink-0" />
                <span>Runs directly on your device</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="mb-3.5">
                  <h3 className="text-base sm:text-lg font-black uppercase leading-none mb-1">
                    03. Explore Your Report
                  </h3>
                  <span className="text-[11px] font-mono text-gray-600 font-bold block">
                    Personal Dashboard
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                  Review your developer archetypes, repository trophies, mock court verdicts, and activity charts. Save your report or reset anytime.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/10 text-[11px] font-mono font-bold text-gray-500 flex items-center gap-1.5">
                <Check className="size-3.5 text-green-700 stroke-[3] shrink-0" />
                <span>Instant export • 1-Click reset</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------- SECTION 4: PRIVACY FOCUS ------------------- */}
      <section id="privacy" className="w-full">
        <div className="border-[3px] border-black bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[3px_3px_0_0_#000]">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Privacy-First Architecture
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 font-bold max-w-xl mx-auto mt-1">
              Your source code and repository data stay strictly on your device and are never sent to external servers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border-2 border-black p-4 rounded-xl bg-amber-50/50 shadow-[1.5px_1.5px_0_0_#000]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4.5 text-green-700 stroke-[3] shrink-0" />
                <h4 className="text-xs font-black uppercase">0% Cloud Storage</h4>
              </div>
              <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                No cloud databases or remote servers. Your report lives exclusively inside your web browser.
              </p>
            </div>

            <div className="border-2 border-black p-4 rounded-xl bg-amber-50/50 shadow-[1.5px_1.5px_0_0_#000]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4.5 text-green-700 stroke-[3] shrink-0" />
                <h4 className="text-xs font-black uppercase">Temporary Access</h4>
              </div>
              <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                Your login is kept active only during your session and is never permanently written to disk.
              </p>
            </div>

            <div className="border-2 border-black p-4 rounded-xl bg-amber-50/50 shadow-[1.5px_1.5px_0_0_#000]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4.5 text-green-700 stroke-[3] shrink-0" />
                <h4 className="text-xs font-black uppercase">Zero Tracking</h4>
              </div>
              <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                No third-party trackers, analytics beacons, or session recorders watching your activity.
              </p>
            </div>

            <div className="border-2 border-black p-4 rounded-xl bg-amber-50/50 shadow-[1.5px_1.5px_0_0_#000]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4.5 text-green-700 stroke-[3] shrink-0" />
                <h4 className="text-xs font-black uppercase">1-Click Reset</h4>
              </div>
              <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                Download a private copy of your full report or clear all your local analysis data in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------- SECTION 5: FREQUENTLY ASKED QUESTIONS ------------------- */}
      <section id="faq" className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 font-bold max-w-xl mx-auto mt-2">
            Everything you need to know about how Gitopsy works.
          </p>
        </div>

        <div className="space-y-3 max-w-4xl mx-auto">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border-[2.5px] border-black bg-white rounded-xl sm:rounded-2xl shadow-[3px_3px_0_0_#000] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-black uppercase text-xs sm:text-sm cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div className="size-6 flex items-center justify-center shrink-0">
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="size-4 relative flex items-center justify-center"
                    >
                      {/* Horizontal bar */}
                      <span className="absolute w-3.5 h-[2.5px] bg-black rounded-full" />
                      {/* Vertical bar (morphs out when open to become -) */}
                      <motion.span
                        animate={{
                          scaleY: isOpen ? 0 : 1,
                          opacity: isOpen ? 0 : 1,
                        }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute h-3.5 w-[2.5px] bg-black rounded-full origin-center"
                      />
                    </motion.div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-black/15 bg-[#FFFDF9] px-4 sm:px-5 py-4 text-xs font-semibold text-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------- FOOTER ------------------- */}
      <footer className="max-w-5xl mx-auto w-full text-center mt-2">
        <div className="pt-6 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between text-xs font-bold uppercase text-gray-700 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-nowrap">
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
            className="hover:underline hover:text-black transition-colors"
          >
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
