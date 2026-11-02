## Project rules

- Demo mode lives only in browser sessionStorage via `src/services/demoService.ts`; every read enforces `expires_at` and clears expired sessions — why: demo data must never reach the backend nor outlive its trial window.
- Vocabulary sectors exclude `multi-ateliers` and `consommables` (`SectorModuleId`); those modules fall back to `NEUTRAL_VOCABULARY` — why: stock has no business vocabulary of its own.
- Route redirects in layout components run in `useEffect`, never during render — why: navigating during render triggers React setState-in-render errors.
