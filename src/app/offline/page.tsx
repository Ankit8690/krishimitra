import Link from "next/link";

export const metadata = { title: "Offline — KrishiMitra" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-primary text-white grid place-items-center text-3xl">
          🌾
        </div>
        <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
        <p className="mt-2 text-brand-mute text-sm max-w-sm mx-auto">
          KrishiMitra needs an internet connection to load fresh weather, mandi
          prices, and AI answers. Recently viewed pages are still available.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 h-12 px-6 rounded-xl bg-brand-primary text-white font-semibold leading-[3rem]"
        >
          Try dashboard
        </Link>
      </div>
    </div>
  );
}
