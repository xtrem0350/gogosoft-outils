# GogoSoft Tools Manager

GogoSoft Tools Manager est une application SaaS multi-tenant pour les réparateurs de téléphones. Elle centralise les outils de réparation, les boutiques, les membres d'équipe, les clients, les fiches d'atelier, l'historique et les abonnements.

## Stack technique

- React 19, TypeScript strict et Vite
- TanStack Router
- Supabase Auth, PostgreSQL et Row Level Security
- shadcn/ui, Radix UI, Tailwind CSS
- React Hook Form, Zod et Sonner
- Bun ou Node.js/npm
- Déploiement Vercel

## Prérequis

- Node.js 20+ ou Bun installé
- Un projet Supabase configuré
- Un compte Vercel pour le déploiement
- Un compte Supabase avec accès au SQL Editor

## Installation

```bash
git clone https://github.com/xtrem0350/gogosoft-outils.git
cd gogosoft-outils
bun install
cp .env.example .env.local
bun run dev
```

Sous Windows PowerShell, utilisez `Copy-Item .env.example .env.local` à la place de `cp`.

## Configuration Supabase

Le projet utilise le projet Supabase déjà configuré dans l'environnement. Renseignez les variables publiques dans `.env.local` sans les commiter :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
VITE_DEMO_MODE=false
VITE_LOCAL_AGENT_URL=http://localhost:4567
```

Dans le SQL Editor Supabase :

1. Exécutez les migrations de `supabase/migrations/` dans l'ordre chronologique.
2. Vérifiez les tables `shops`, `shop_members`, `clients`, `workshop_tickets`, `tools`, `subscriptions` et `payments`.
3. Vérifiez que RLS est activé et que les policies limitent chaque utilisateur à ses boutiques.
4. Activez la confirmation d'e-mail selon le parcours d'inscription souhaité.

La clé service Supabase ne doit jamais être utilisée dans le navigateur.

## Scripts disponibles

```bash
bun run dev
bun run type-check
bun run lint
bun run build
bun run preview
```

Les scripts npm équivalents sont également disponibles : `npm run dev`, `npm run type-check`, `npm run lint`, `npm run build` et `npm run preview`.

## Déploiement Vercel

1. Importez le dépôt GitHub dans Vercel.
2. Ajoutez `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DEMO_MODE` et `VITE_LOCAL_AGENT_URL` dans les variables d'environnement.
3. Utilisez `bun run build` comme commande de build, ou `npm run build` si Vercel utilise npm.
4. Le résultat est généré par Vite ; Vercel détecte automatiquement la sortie `dist`.
5. Redéployez après chaque modification des variables d'environnement.

## Parcours de test rapide

1. Ouvrir l'application déconnecté et vérifier la redirection vers `/auth`.
2. Créer un compte avec nom et téléphone.
3. Créer une première boutique.
4. Vérifier le dashboard vide et l'absence de données fictives.
5. Créer un client puis une fiche d'atelier.
6. Modifier le statut de la réparation et ouvrir le lien WhatsApp.
7. Ajouter, modifier, dupliquer et supprimer un outil.
8. Vérifier les catégories et les compteurs d'outils.
9. Inviter un membre et contrôler l'isolation entre boutiques.
10. Vérifier l'abonnement, l'historique et les statistiques.
11. Se déconnecter et confirmer qu'aucune donnée privée n'est chargée.

## Structure du projet

```text
src/
  components/       UI métier et composants shadcn/ui
  hooks/            Auth, boutique, outils et abonnement
  integrations/     Client et types Supabase
  lib/              Helpers et utilitaires
  routes/           Pages TanStack Router
  services/         Accès Supabase et logique métier
  types/            Types TypeScript du domaine
supabase/
  migrations/       Schéma PostgreSQL, RLS et évolutions
public/             Assets statiques dont le favicon
```

## Documentation produit

La vision, la mission, la proposition de valeur, le modèle économique et la roadmap sont disponibles dans [docs/missions.md](docs/missions.md).