"use client";

import { Mail, Phone, MapPin } from "lucide-react";

// Brand marks — lucide-react removed these in newer versions, so inline the
// official 24×24 monochrome glyphs.
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
 * Signature block for the person who built KrishiMitra.
 * Rendered at the bottom of the landing page and the dashboard home so
 * anyone browsing the app (or an interview evaluator) can reach out.
 */
export function AuthorFooter() {
  return (
    <footer className="mt-16 mb-6 pt-8 border-t border-brand-line">
      {/* Personal quote — wrapped in a solid card so it stays readable over
       * the dashboard backdrop image */}
      <div className="max-w-3xl mx-auto mb-8 px-4">
        <div className="relative rounded-2xl bg-brand-surface border border-brand-line shadow-md px-6 py-7 md:px-10 md:py-9 text-center">
          <span
            aria-hidden
            className="absolute top-2 left-3 text-6xl font-serif text-brand-primary/30 leading-none select-none"
          >
            &ldquo;
          </span>
          <span
            aria-hidden
            className="absolute bottom-4 right-4 text-6xl font-serif text-brand-primary/30 leading-none select-none"
          >
            &rdquo;
          </span>
          <p className="relative text-lg md:text-xl font-bold text-brand-ink leading-relaxed">
            Technology serves best when it serves the hands that feed us. Every
            farmer, in every village, deserves the same tools a Bengaluru
            startup takes for granted — KrishiMitra is my small step toward
            closing that gap.
          </p>
          <div className="relative mt-4 flex items-center justify-center gap-2 pt-3 border-t border-brand-line/60">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-emerald-700 text-white grid place-items-center font-bold text-xs shadow-sm">
              AS
            </span>
            <span className="font-bold text-brand-ink">Ankit Sharma</span>
            <span className="text-brand-mute text-sm">· builder of KrishiMitra</span>
          </div>
        </div>
      </div>

      {/* Contact card */}
      <div className="max-w-2xl mx-auto rounded-2xl bg-brand-surface border border-brand-line shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-emerald-700 grid place-items-center text-white text-xl font-bold shrink-0 shadow-md">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-ink text-lg">Ankit Sharma</p>
            <p className="text-xs text-brand-mute inline-flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> B.E. Computer Engineering · Thapar
              Institute, Patiala
            </p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
              <a
                href="mailto:asharma18_be23@thapar.edu"
                className="inline-flex items-center gap-2 text-brand-ink hover:text-brand-primary transition min-w-0"
              >
                <span className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary grid place-items-center shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                <span className="truncate">asharma18_be23@thapar.edu</span>
              </a>
              <a
                href="tel:+918690554658"
                className="inline-flex items-center gap-2 text-brand-ink hover:text-brand-primary transition"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                  <Phone className="w-4 h-4" />
                </span>
                <span>+91 86905 54658</span>
              </a>
              <a
                href="https://github.com/Ankit8690"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-ink hover:text-brand-primary transition"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 grid place-items-center shrink-0">
                  <GithubIcon className="w-4 h-4" />
                </span>
                <span>github.com/Ankit8690</span>
              </a>
              <a
                href="https://www.linkedin.com/in/ankit-sharma-52a1a728a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-ink hover:text-brand-primary transition"
              >
                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 grid place-items-center shrink-0">
                  <LinkedinIcon className="w-4 h-4" />
                </span>
                <span>LinkedIn profile</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-brand-mute">
        © 2026 KrishiMitra · Made with 🌾 in Patiala, India
      </p>
    </footer>
  );
}
