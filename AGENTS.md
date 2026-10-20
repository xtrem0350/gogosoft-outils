<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Project rules

- Demo mode lives only in browser sessionStorage via `src/services/demoService.ts`; every read enforces `expires_at` and clears expired sessions — why: demo data must never reach the backend nor outlive its trial window.
- Vocabulary sectors exclude `multi-ateliers` and `consommables` (`SectorModuleId`); those modules fall back to `NEUTRAL_VOCABULARY` — why: stock has no business vocabulary of its own.
- Route redirects in layout components run in `useEffect`, never during render — why: navigating during render triggers React setState-in-render errors.
