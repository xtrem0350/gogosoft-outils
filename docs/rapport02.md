# Rapport 02 — Pourquoi la landing est sur `/demo`

**Date :** 7 octobre 2026

## Constat

La landing de démonstration est explicitement déclarée avec `createFileRoute("/demo")` dans `src/routes/demo.tsx`. TanStack Router l’enregistre ensuite dans le fichier généré `src/routeTree.gen.ts`.

La route `/` existe séparément dans `src/routes/index.tsx` et correspond au tableau de bord. Le composant racine affiche `/demo` sans l’`AppShell`, afin que la page soit accessible publiquement; il ne navigue pas vers cette route.

La recherche dans `src/` ne trouve aucun lien ni appel `navigate()` qui redirige vers `/demo`. Après avoir démarré une démo, la page appelle au contraire `navigate({ to: "/" })`. La configuration `vercel.json` réécrit les chemins applicatifs vers `/index.html` pour le fallback SPA; cette règle ne redirige pas l’URL vers `/demo`.

## Explication

La page apparaît sur `/demo` lorsque cette URL est celle qui est ouverte (saisie, lien externe ou favori). Ce comportement vient du choix de chemin dans la déclaration de route, pas d’une redirection automatique observée dans le code.

Si la landing de démonstration doit être la page d’accueil du site, il faudra décider de remplacer le tableau de bord à `/` ou d’ajouter une redirection de `/` vers `/demo`. Aucune de ces options n’a été appliquée, car `/` est actuellement la route fonctionnelle du tableau de bord.

## Validation et périmètre

- `npm run type-check` : réussi après l’ajout de la route.
- `npm run build` : réussi.
- `.env` et `src/integrations/supabase/` : non modifiés pour cette fonctionnalité.