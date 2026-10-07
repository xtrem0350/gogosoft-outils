# Rapport 03 — Ajustements de routage et sécurisation des redirections

## Contexte

Le projet GogoSoft Tools Manager avait une cohabitation problématique entre la landing publique et le dashboard interne : la route racine `/` exposait encore le tableau de bord au lieu d’une vraie page d’accueil publique. Cela créait une confusion entre les usages du produit et compromettait le parcours utilisateur attendu.

Le besoin était de séparer correctement les zones :

- `/` → landing publique
- `/demo` → démo module
- `/auth` → authentification
- `/dashboard` → tableau de bord protégé

## Modifications réalisées

### 1) Réorganisation des routes publiques et internes

- Création d’une landing publique dans [src/routes/index.tsx](../src/routes/index.tsx)
- Déplacement du dashboard interne vers la route dédiée [src/routes/dashboard.tsx](../src/routes/dashboard.tsx)
- Mise à jour de la configuration du routeur racine dans [src/routes/__root.tsx](../src/routes/__root.tsx) pour ne pas afficher l’AppShell sur les pages publiques

La logique de route publique a été alignée sur ce schéma :

- `/` : landing
- `/demo` : choix des modules et lancement de la démo
- `/auth` : connexion / inscription
- `/mot-de-passe-oublie` : récupération de mot de passe
- `/reinitialiser-mot-de-passe` : réinitialisation
- `/dashboard` : espace privé du réparateur

### 2) Redirection après authentification

Les redirections après succès d’authentification ont été corrigées dans [src/routes/auth.tsx](../src/routes/auth.tsx) :

- connexion réussie → `/dashboard`
- inscription réussie → `/boutiques/nouveau`

Cela évite de renvoyer l’utilisateur vers la landing publique alors qu’il vient de s’authentifier.

### 3) Sécurisation des accès privés

Le composant [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx) a été vérifié pour que les utilisateurs non connectés soient redirigés vers `/auth`.

Le garde d’abonnement [src/components/SubscriptionGuard.tsx](../src/components/SubscriptionGuard.tsx) a aussi été ajusté pour renvoyer vers la bonne route d’abonnement ou la page de dashboard une fois la sélection validée.

### 4) Démo et retour au tableau de bord

- La route de démonstration [src/routes/demo.tsx](../src/routes/demo.tsx) envoie désormais l’utilisateur vers `/dashboard` après le lancement de la démo.
- Le dashboard [src/routes/dashboard.tsx](../src/routes/dashboard.tsx) a également été ajusté pour rediriger correctement les flux de mise à jour du forfait vers le bon espace protégé.

### 5) Navigation interne

Les liens internes de type “Accueil” dans l’AppShell ont été réorientés vers le dashboard au lieu de la landing publique, afin de maintenir une logique cohérente dans l’application connectée : [src/components/AppShell.tsx](../src/components/AppShell.tsx)

### 6) Génération du routeur et formatage

Un problème de routeTree a été identifié lors de la validation TypeScript : le fichier généré [src/routeTree.gen.ts](../src/routeTree.gen.ts) n’était pas synchronisé avec la nouvelle route `/` publique. Il a été corrigé pour inclure la route d’index publique.

Le projet présentait également des erreurs de formatage liées au style de fin de ligne (CRLF), qui empêchaient la validation ESLint/Prettier. Un formatage global des fichiers source a été appliqué pour rétablir un état propre et exploitable.

## Validation

La commande suivante a été exécutée avec succès :

```bash
npm run type-check && npm run lint && npm run build
```

Résultat obtenu :

- TypeScript OK
- ESLint OK
- Build OK

## Bilan

Les routes sont désormais cohérentes avec le parcours attendu :

- landing publique sur `/`
- démo indépendante sur `/demo`
- authentification sur `/auth`
- dashboard protégé sur `/dashboard`

L’application conserve le thème orange/blanc/vert existant, sans casser les fonctionnalités déjà en place, tout en rétablissant une logique de navigation plus claire pour les visiteurs et les utilisateurs connectés.
