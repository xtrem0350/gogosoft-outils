import { motion } from "framer-motion";

import profileLogo from "@/assets/images/profile.png";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center text-white">
        <motion.img
          src={profileLogo}
          alt="GogoSoft logo"
          className="h-28 w-28 rounded-2xl object-cover shadow-2xl shadow-blue-500/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.95] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <motion.h1
          className="mt-6 text-5xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          GogoSoft
        </motion.h1>

        <motion.p
          className="mt-2 text-xl text-blue-300"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Tools Manager
        </motion.p>

        <motion.p
          className="mt-6 text-sm text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Solutions pour réparateurs de téléphones
        </motion.p>

        <div className="mt-8 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200"
            initial={{ width: 0 }}
            animate={{ width: "70%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
