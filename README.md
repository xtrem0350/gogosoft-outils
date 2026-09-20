# GogoSoft Tools Hub

# 🎯 PROMPT — Application Web « GogoSoft Tools Manager »

## 📌 Contexte

Je suis **Thierry Gogo**, développeur FullStack, fondateur de **GogoSoft Technology Solutions**. Je gère quotidiennement une collection d'outils de réparation mobile (MTK, Unisoc/SPD, Apple, Drivers, etc.) stockés à divers emplacements sur mon PC Windows.

J'ai déjà une page HTML statique (`organisation-outils.html`, ci-jointe) qui liste ces outils par catégories, avec pour chaque outil : nom, version, chemin, et un bouton « Ouvrir le dossier » qui appelle un serveur local (`POST /open`) pour lancer l'Explorateur Windows.

**Je veux maintenant transformer cette page en une véritable application web full-stack**, moderne, multi-utilisateur, avec base de données, authentification, et gestion complète des outils.

## 🛠️ Stack technique imposée

Utilise **exactement** la même stack que mon application existante :

| Couche | Technologie |

|---|---|

| **Frontend** | React + TypeScript + Vite |

| **Routage** | TanStack Router (routes basées sur les fichiers) |

| **UI** | shadcn/ui + Tailwind CSS + Radix UI |

| **Icônes** | Lucide React + Font Awesome |

| **Formulaires** | React Hook Form + Zod |

| **Notifications** | Sonner |

| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage) |

| **Runtime / PM** | Bun |

| **Linting** | ESLint |

## 🎯 Fonctionnalités exactes à implémenter

### 1. Gestion des outils (CRUD complet)

- **Lister** : afficher tous les outils, avec filtres par catégorie, type, favori, et recherche par nom/version/chemin.

- **Ajouter** : formulaire pour créer un nouvel outil avec tous les champs ci-dessous.

- **Modifier** : édition de n'importe quel champ d'un outil existant.

- **Supprimer** : suppression avec confirmation (soft delete de préférence, avec possibilité de restaurer).

- **Dupliquer** : cloner un outil existant pour créer une variante rapidement.

### 2. Champs par outil

| Champ | Type | Obligatoire | Description |

|---|---|---|---|

| `id` | UUID | Auto | Identifiant unique |

| `nom` | string | Oui | Nom de l'outil (ex: « TSM PRO ») |

| `version` | string | Non | Version (ex: « 2.4.1 ») |

| `chemin` | string | Oui | Chemin complet sur le disque (ex: `C:\Program Files (x86)\TurboServiceMobile`) |

| `type` | enum | Oui | `exe`, `archive`, `dossier` |

| `categorie` | enum | Oui | `MTK`, `Unisoc`, `Apple`, `Drivers`, `Autres` |

| `sous_categorie` | string | Non | Ex: « Noyau », « Pilotes », « Outils » |

| `description` | text | Non | Description courte de l'outil |

| `favori` | boolean | Non | Marqué comme favori (défaut: false) |

| `icone` | string | Non | Nom d'icône Font Awesome ou Lucide |

| `tags` | string[] | Non | Mots-clés pour la recherche |

| `created_at` | timestamp | Auto | Date de création |

| `updated_at` | timestamp | Auto | Date de dernière modification |

| `created_by` | UUID | Auto | Utilisateur créateur |

### 3. Suivi d'utilisation

- **Compteur de lancements** : chaque fois qu'un outil est lancé, incrémenter un compteur.

- **Dernière utilisation** : enregistrer la date/heure du dernier lancement.

- **Statistiques** : afficher les outils les plus utilisés dans un dashboard.

### 4. Historique

- **Table `tool_launches`** : enregistrer chaque lancement avec `tool_id`, `user_id`, `timestamp`, `action` (`open_folder`, `launch_exe`, etc.).

- **Page historique** : liste chronologique des lancements, filtrable par outil, utilisateur, date.

- **Journal des modifications** : enregistrer les créations, modifications et suppressions d'outils.

### 5. Lancement des outils

- **Bouton « Ouvrir le dossier »** : lance l'Explorateur Windows sur le dossier contenant l'outil (comme dans la page actuelle).

- **Bouton « Lancer l'outil »** : si le type est `exe`, lance directement l'exécutable.

- **Bouton « Ouvrir l'archive »** : si le type est `archive`, ouvre l'archive avec WinRAR/7-Zip.

- **Backend local** : un petit serveur Node.js/Bun qui expose `POST /open` et `POST /launch` pour interagir avec le système de fichiers Windows.

### 6. Multi-utilisateur

- **Authentification** : Supabase Auth (email/mot de passe + OTP téléphone si possible, comme dans mon app existante).

- **Rôles** :

  - `admin` : peut tout faire (CRUD, gérer les utilisateurs, voir l'historique global).

  - `technicien` : peut ajouter/modifier des outils, lancer des outils, voir son propre historique.

  - `lecteur` : peut seulement consulter et lancer les outils.

- **Row Level Security (RLS)** : chaque utilisateur ne voit que ce qu'il a le droit de voir.

- **Profil utilisateur** : nom, email, rôle, préférences (catégories favorites, thème sombre/clair).

## 🎨 Interface & Design

- **Reprendre le design de la page HTML actuelle** : header dégradé bleu nuit, logo `profile.jpeg`, badges, sections par catégorie, cartes d'outils.

- **Ajouter** :

  - Une **barre latérale** (sidebar) avec navigation : Dashboard, Outils, Catégories, Historique, Statistiques, Paramètres.

  - Un **dashboard** avec cartes statistiques (nombre d'outils, lancements du jour, outils favoris, top 5 des outils les plus utilisés).

  - Une **vue grille** et une **vue liste** pour les outils.

  - Un **mode sombre** et un **mode clair**.

  - Des **animations fluides** (transitions, hover, etc.).

- **Responsive** : doit fonctionner sur desktop, tablette et mobile.

## 🗄️ Schéma Supabase à créer

```sql

-- Table des outils

CREATE TABLE tools (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom TEXT NOT NULL,

  version TEXT,

  chemin TEXT NOT NULL,

  type TEXT CHECK (type IN ('exe', 'archive', 'dossier')) NOT NULL,

  categorie TEXT CHECK (categorie IN ('MTK', 'Unisoc', 'Apple', 'Drivers', 'Autres')) NOT NULL,

  sous_categorie TEXT,

  description TEXT,

  favori BOOLEAN DEFAULT FALSE,

  icone TEXT,

  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  created_by UUID REFERENCES auth.users(id)

);

-- Table des lancements

CREATE TABLE tool_launches (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,

  user_id UUID REFERENCES auth.users(id),

  action TEXT CHECK (action IN ('open_folder', 'launch_exe', 'open_archive')) NOT NULL,

  launched_at TIMESTAMPTZ DEFAULT NOW()

);

-- Table des logs de modifications

CREATE TABLE tool_logs (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,

  user_id UUID REFERENCES auth.users(id),

  action TEXT CHECK (action IN ('create', 'update', 'delete', 'restore')) NOT NULL,

  changes JSONB,

  logged_at TIMESTAMPTZ DEFAULT NOW()

);

-- RLS

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

ALTER TABLE tool_launches ENABLE ROW LEVEL SECURITY;

ALTER TABLE tool_logs ENABLE ROW LEVEL SECURITY;

```

## 📁 Structure du projet à générer

```

gogosoft-tools-manager/

├── src/

│   ├── routes/

│   │   ├── __root.tsx

│   │   ├── index.tsx              (Dashboard)

│   │   ├── outils.tsx             (Liste des outils)

│   │   ├── outils.$id.tsx         (Détail d'un outil)

│   │   ├── outils.ajouter.tsx     (Ajout)

│   │   ├── outils.$id.modifier.tsx (Édition)

│   │   ├── categories.tsx

│   │   ├── historique.tsx

│   │   ├── statistiques.tsx

│   │   ├── parametres.tsx

│   │   └── auth.tsx

│   ├── components/

│   │   ├── ui/                    (shadcn/ui)

│   │   ├── AppShell.tsx

│   │   ├── Sidebar.tsx

│   │   ├── ToolCard.tsx

│   │   ├── ToolForm.tsx

│   │   ├── CategoryBadge.tsx

│   │   ├── StatsCard.tsx

│   │   └── ...

│   ├── services/

│   │   ├── toolService.ts

│   │   ├── launchService.ts

│   │   ├── historyService.ts

│   │   └── authService.ts

│   ├── hooks/

│   │   ├── useAuth.tsx

│   │   ├── useTools.ts

│   │   └── useStats.ts

│   ├── lib/

│   │   ├── supabase.ts

│   │   └── utils.ts

│   ├── types/

│   │   └── database.ts

│   └── assets/

│       └── images/

│           ├── profile.jpeg

│           └── logo.png

├── supabase/

│   ├── schema.sql

│   └── migrations/

├── server/

│   └── server.ts                  (Serveur local Bun/Node pour /open et /launch)

├── package.json

├── vite.config.ts

├── tsconfig.json

└── README.md

```

## 🚀 Livrables attendus

1. **Schéma Supabase complet** (SQL) avec RLS.

2. **Structure du projet** complète avec tous les fichiers.

3. **Composants React** principaux (AppShell, Sidebar, ToolCard, ToolForm, Dashboard).

4. **Services TypeScript** pour interagir avec Supabase.

5. **Serveur local** (Bun ou Node) qui expose `/open` et `/launch`.

6. **Routes TanStack** pour toutes les pages.

7. **Documentation** dans le README : installation, configuration Supabase, lancement du serveur local, déploiement.

8. **Design** fidèle à la page HTML actuelle, avec les améliorations demandées.

## ⚠️ Contraintes importantes

- **Le code doit être complet et fonctionnel**, pas de pseudo-code.

- **Utilise TypeScript strict** partout.

- **Respecte les conventions shadcn/ui** pour les composants.

- **Le serveur local** doit fonctionner sous Windows 10/11.

- **Prévois un mode démo** avec des données fictives pour tester sans Supabase.

- **Documente chaque fonction** avec des commentaires JSDoc.

## 📎 Fichier joint

`organisation-outils.html` — ma page actuelle, à transformer en application.

---

**Merci de générer l'application complète, prête à être installée et lancée.**

---

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gogosoft-outils.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5ad9f6c3-e0d5-4855-adb7-5265bf9489b3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploiement sur Vercel

### Prerequis

- Un compte Vercel et un projet Supabase
- Un depot Git distant (GitHub, GitLab ou Bitbucket)
- Bun ou Node.js installe localement

### Configuration locale

Copiez `.env.example` vers `.env.local`, puis renseignez `VITE_SUPABASE_URL` et
`VITE_SUPABASE_PUBLISHABLE_KEY`. Seule la cle publique Supabase doit etre utilisee dans
le navigateur. Ne placez jamais de cle `service_role` dans une variable `VITE_*`.

Les variables disponibles sont documentees dans `.env.example`. Le mode demo
peut etre active avec `VITE_DEMO_MODE=true` lorsque Supabase n'est pas configure.

### Deployer

1. Poussez le projet sur votre depot Git.
2. Dans Vercel, choisissez **Import Git Repository** et selectionnez le depot.
3. Ajoutez `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `VITE_DEMO_MODE` dans
  **Settings > Environment Variables** pour Production, Preview et Development.
4. Ajoutez `VITE_LOCAL_AGENT_URL` uniquement en Development. Un navigateur Vercel
  ne peut pas joindre l'agent Windows local d'un utilisateur distant.
5. Lancez le deploiement. Vercel reutilise `vercel.json` pour les routes SPA.

Le fichier `vercel.json` redirige les URLs sans extension vers l'application tout
en laissant les fichiers statiques servis directement. Les routes `/`, `/outils`
et `/outils/123` peuvent ainsi etre rechargees sans erreur 404.

### Verification avant push

```bash
bun install
bun run type-check
bun run lint
bun run build
bun run preview
```

Ouvrez ensuite `http://localhost:4173` et testez la navigation ainsi que le
rechargement direct d'une route interne. Apres chaque modification de variable
d'environnement dans Vercel, redeployez le projet pour reconstruire le bundle.

### Rollback

Dans Vercel, ouvrez **Deployments**, choisissez le dernier deploiement stable,
puis utilisez **... > Promote to Production**.
