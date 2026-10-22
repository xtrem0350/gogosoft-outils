# Ordre conseillé des migrations Supabase

Pour une base Supabase vide, exécuter les migrations **une par une** dans le SQL
Editor, dans l’ordre ci-dessous. Vérifier le résultat de chaque fichier avant de
continuer.

## Ordre recommandé

1. `20260918115915_542c7e2f-3dd2-423a-8297-a19d9393464f.sql` — socle; crée notamment `public.app_role`.
2. `20260918115927_f851f768-05d7-4c81-b27a-65464ac28174.sql` — droits du socle.
3. `20260920192317_859fb027-231f-479c-9c9f-57e04fa75ed1.sql` — table initiale des fiches atelier.
4. `20260921000000_saas_mvp.sql` — boutiques, membres, abonnements, paiements et clients.
5. `20260921235847_f024e900-7b07-4754-aeac-61418d89ac06.sql` — helpers et politiques multi-boutiques.
6. `20260922000000_extras.sql` — modèles WhatsApp et journaux d’audit.
7. `20260923000000_pseudo.sql` — pseudo et recherche d’identifiant.
8. `20260923122630_5dcb2912-d6c6-4bc1-8d4a-5bf61650a054.sql` — événements et guides de réparation.
9. `20260925000000_super_admin.sql` — rôle super-admin et politiques associées.
10. `20260926000000_fix_user_roles_rls.sql` — politiques des rôles utilisateur.
11. `20260927000000_workshop_type.sql` — types d’activité atelier/outils.
12. `20260927000001_sales.sql` — ventes et stockage de photos.
13. `20260930000000_pricing_domain.sql` — colonnes liées aux domaines et appareils.
14. `20261003000000_activity_modules.sql` — modules d’activité et tarifs initiaux.
15. `20261005110544_8098a51b-a58c-4bda-a163-182a6084d95a.sql` — version complémentaire des modules et tarifs.
16. `20261006000000_backfill_shop_modules.sql` — données de modules pour les boutiques existantes.
17. `20261006090000_admin_platform.sql` — notifications et support de plateforme.
18. `20261007000000_vitrine_pricing.sql` — vitrine en ligne, produits, commandes et tarifs finaux.

Les tables `auth.users`, les fonctions d'authentification et le schéma Storage
(`storage.objects`, `storage.buckets`) sont fournis par Supabase; aucune migration
du dépôt ne les crée complètement.

## À ne pas exécuter tels quels

- **`20260920000000_workshop.sql`** : crée une deuxième version de
  `workshop_tickets`. C'est celle qui échoue sur `public.app_role` si elle est
  lancée avant le socle. Elle ajoute aussi des policies larges. La séquence
  ci-dessus utilise plutôt `20260920192317_…sql`, suivie des politiques
  multi-boutiques de `20260921235847_…sql`.
- **`20260923000000_avatar.sql`** : contient `CREATE POLICY IF NOT EXISTS`,
  syntaxe non valide pour PostgreSQL. Ne pas l'exécuter avant correction.
  Cette migration touche aussi aux objets Storage gérés par Supabase.

## Dépendances et précautions

- `public.app_role` est créé par la migration **`20260918115915_…sql`**.
  C'est pourquoi elle doit précéder toute migration qui utilise ce type,
  notamment les migrations atelier.
- `20260920192317_…sql` contient un `CREATE TABLE` sans `IF NOT EXISTS` :
  ne l'exécuter qu'une fois.
- Plusieurs fichiers créent des policies sans les supprimer d'abord. Ne rejouez
  pas les migrations sur une base déjà migrée : les policies peuvent se cumuler.
- `20261007000000_vitrine_pricing.sql` exécute `DELETE FROM pricing_config`
  avant d'insérer ses tarifs. Sur une base contenant déjà des données, cette
  opération efface les tarifs existants.
- Les migrations utilisent `gen_random_uuid()`. Supabase fournit normalement
  cette fonction; aucun `CREATE EXTENSION` explicite n'est présent dans ces
  fichiers.
- Ce guide est basé sur une lecture statique des migrations. Il ne remplace pas
  une sauvegarde ni une vérification de l'état réel du projet Supabase.

**Recommandation :** exécuter fichier par fichier dans l'ordre ci-dessus; ne pas
coller un script master et ne pas relancer une migration qui a déjà réussi.
