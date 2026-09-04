"use client";

import { Mail, Phone } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a10.98 10.98 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.05.78 2.13 0 1.54-.01 2.79-.01 3.17 0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/**
 * Slim signature strip at the very bottom of the landing + dashboard-home
 * pages. One row on desktop, wraps to two on mobile. Uses the light-blue
 * palette the user asked for.
 */
export function AuthorFooter() {
  return (
    <footer className="mt-14 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-800 text-white shadow-lg">
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 text-sm">
        {/* Left: identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-full bg-white text-sky-800 grid place-items-center font-bold text-xs shadow-sm">
            AS
          </span>
          <div className="leading-tight">
            <p className="font-bold">Ankit Sharma</p>
            <p className="text-[11px] text-white/75">Builder · KrishiMitra</p>
          </div>
        </div>

        {/* Middle: quote */}
        <p className="italic text-white/95 text-[13px] leading-snug flex-1 min-w-0">
          &ldquo;Technology serves best when it serves the hands that feed us.&rdquo;
        </p>

        {/* Right: contact icons */}
        <div className="flex items-center gap-1 shrink-0">
          <a
            href="mailto:asharma18_be23@thapar.edu"
            aria-label="Email"
            title="asharma18_be23@thapar.edu"
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href="tel:+918690554658"
            aria-label="Phone"
            title="+91 86905 54658"
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href="https://github.com/Ankit8690"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="github.com/Ankit8690"
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/ankit-sharma-52a1a728a"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition"
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-2 text-center text-[11px] text-white/70">
        © 2026 KrishiMitra · Made with 🌾 in Patiala, India
      </div>
    </footer>
  );
}
