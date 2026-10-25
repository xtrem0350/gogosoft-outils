import { motion } from "framer-motion";

import splashLogo from "@/assets/images/profile.png";

export function SplashScreen() {
  if (typeof window === "undefined") return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950" />
      <motion.div
        className="relative flex w-full max-w-md flex-col items-center text-center opacity-0 transition-opacity duration-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src={splashLogo}
          alt="GogoSoft logo"
          className="size-32 rounded-full object-cover shadow-2xl shadow-black/40"
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.95] }}
          transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <motion.h1
          className="mt-5 text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          GogoSoft
        </motion.h1>

        <motion.p
          className="mt-2 text-lg font-medium text-white/90 md:text-xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          Tools Manager
        </motion.p>

        <motion.p
          className="mt-5 text-base font-medium text-white/90 md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          La tech clé en main pour votre atelier et boutique.
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          Réparation téléphone &amp; PC · Vente · Vitrine en ligne · Gestion d&apos;atelier
        </motion.p>

        <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-orange-400 via-yellow-300 to-green-800"
            initial={{ width: 0 }}
            animate={{ width: "70%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
