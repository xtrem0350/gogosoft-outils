# Versioning

À chaque nouvelle version :

1. Modifier `APP_VERSION` dans `src/lib/version.ts`.
2. Ajouter une note en tête de `RELEASE_NOTES` avec la date, le titre et les points marquants.
3. Mettre à jour `public/version.json` avec la même version et la date de publication.
4. Commit et push : Vercel redéploie automatiquement.
5. Au prochain lancement, les utilisateurs connectés voient la modale « Quoi de neuf ? » jusqu'à sa fermeture.

La version déjà consultée est conservée dans le `localStorage` du navigateur sous `gogosoft_last_seen_version`.
