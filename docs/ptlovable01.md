# Prompt Lovable — Stabilisation et démo interne GogoSoft

Copie-colle le prompt ci-dessous dans Lovable AI depuis le projet connecté.

```text
CONTEXTE

Tu interviens sur le dépôt existant GogoSoft Tools Manager, une application
React 19, TypeScript strict, Vite 8, TanStack Router/Start et Supabase. Le
projet est déjà en cours de refonte : poursuis le travail existant, ne crée
pas une nouvelle application et ne remplace pas l'architecture.

Objectif prioritaire : stabiliser le démarrage et l'affichage de l'application,
puis permettre à un client de parcourir le MVP grâce à la démo interne, sans
compte et sans écrire de fausses données dans Supabase.

Le thème Orange-Blanc-Vert existant est obligatoire. Réutilise les composants,
services, hooks et types déjà présents. Respecte le TypeScript strict et les
conventions du dépôt.

ÉTAT ET INDICES À VÉRIFIER (NE PAS PRENDRE POUR UNE CAUSE PROUVÉE)

Des démarrages récents de Vite ont été anormalement lents ou bloqués. Un log
fourni affichait :
- Vite 8.1.5 prêt après environ 413 secondes sur http://localhost:8080/ ;
- des étapes d'optimisation des dépendances (scan puis bundling) ;
- une connexion SSR, suivie d'une erreur après laquelle la page restait blanche :
  `transport invoke timed out after 60000ms`, pendant le chargement de
  `virtual:tanstack-start-server-entry` via `fetchModule`.

Un autre essai de `npm run dev -- --force` n'a affiché ni URL ni message Vite
Ready. Les versions observées avant une tentative d'installation étaient
différentes entre `package.json`/`bun.lock` et `package-lock.json`/`node_modules`
(notamment la config Lovable et TanStack Start). Une tentative `npm install`
a ensuite modifié `package-lock.json`, mais n'a pas fourni de résultat exploitable.
Vérifie l'état ACTUEL du dépôt, des lockfiles et de l'installation avant d'agir.

Le warning suivant a également été observé :
`The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths
resolution natively via the resolve.tsconfigPaths option...`
Traite-le comme un avertissement sauf preuve qu'il cause une erreur. Ne cumule
pas plugin et résolution native sans vérifier la config Lovable qui injecte le
plugin et la compatibilité de sa version.

ÉTAT DÉMO CONNU À REVALIDER

- `src/routes/index.tsx` est la route `/` et présente un choix de modules, des
  offres, l'authentification et le démarrage d'une démo.
- `src/services/demoService.ts` contient un mécanisme de démo interne qui stocke
  la session et des données d'exemple dans `sessionStorage`; les données sont
  destinées exclusivement à la démo et sont locales au navigateur.
- `src/routes/demo.tsx` redirige actuellement vers `/`.
- Le démarrage de la démo depuis la page d'accueil navigue vers `/dashboard`.
- `src/types/sectors.ts` définit actuellement
  `SectorModuleId = Exclude<ModuleId, "multi-ateliers">`. Le module `consommables`
  est un module de stock et ne doit pas avoir de vocabulaire métier dédié.
- `src/constants/sectors.ts` contient les six secteurs téléphone/PC de
  réparation, vente et vitrine ; `NEUTRAL_VOCABULARY` pointe sur
  `reparation-telephone`.

Ces éléments sont à confirmer dans le code actuel. Ne présume pas que les fichiers
ou versions sont identiques à cet état.

RÈGLES DE PROTECTION

1. Commence par `git status` et inspecte les changements existants. Préserve-les :
   ne réinitialise pas le dépôt, ne fais pas de checkout/reset destructif, ne
   supprime pas les modifications non liées et ne reformate pas tout le projet.
2. N'édite jamais `.env`, les secrets, `src/integrations/supabase/` (sauf
   `types.ts` si une correction de types est indispensable), ni les migrations
   Supabase, sauf si une cause démontrée l'exige et qu'une justification est donnée.
   N'expose aucun secret dans les logs ou le rapport.
3. N'introduis aucune fausse donnée dans les parcours réels. Les données seedées
   ne sont permises que dans le mode démo explicite et doivent rester isolées du
   compte réel et de Supabase.
4. Ne supprime pas une fonction existante sans remplacement fonctionnel.
   N'affaiblis pas TypeScript, les contrôles d'accès, RLS ou les protections
   multi-tenant pour faire disparaître une erreur.
5. Ne change pas le thème, ne fais pas de refonte visuelle générale et ne touche
   pas à des fichiers sans lien avec le démarrage, le parcours de démo ou les
   erreurs directement bloquantes.
6. Utilise un seul gestionnaire de paquets cohérent avec le lockfile réellement
   utilisé dans l'environnement. N'alterne pas npm et Bun et n'actualise pas
   toutes les dépendances sans nécessité. Si les lockfiles se contredisent,
   détermine lequel est utilisé par le projet/Lovable et explique tout changement.
7. Ne masque pas un blocage en augmentant arbitrairement un timeout. Ne considère
   pas un simple message `VITE ready` comme une validation de la page : fais une
   requête HTTP et vérifie le rendu navigateur.

PHASE 1 — DIAGNOSTIC REPRODUCTIBLE

Avant de modifier le code :

1. Relever l'état Git, les commandes disponibles, les versions Node/npm/Bun
   pertinentes, les lockfiles suivis et les versions installées de Vite,
   `@lovable.dev/vite-tanstack-config`, `@tanstack/react-start`,
   `@tanstack/router-generator` et `vite-tsconfig-paths`. Comparer aux versions
   déclarées et aux lockfiles.
2. Lire la configuration Vite effective et les plugins injectés par
   `@lovable.dev/vite-tanstack-config`. Vérifier la cohérence entre l'entrée
   serveur personnalisée `src/server.ts`, `src/start.ts`, `src/router.tsx`,
   `src/routeTree.gen.ts` et la config TanStack Start. Vérifier les erreurs de
   génération de routes, imports SSR/client et imports incompatibles avec SSR.
3. Lancer `npm run dev -- --force` avec une durée de diagnostic bornée.
   Consigner le temps jusqu'à Vite Ready, puis requêter l'URL réellement annoncée
   (pas un port supposé). Vérifier séparément la réponse HTTP de `/`, les logs
   SSR/client et la console navigateur. Si le port est 8080, tester 8080.
4. Distinguer faits et hypothèses. Le timeout peut venir d'une configuration,
   d'une transformation SSR ou de l'environnement (disque, antivirus, OneDrive,
   processus concurrent), mais ne conclus à une cause environnementale qu'avec
   des éléments observables.
5. Ne modifie pas les fichiers métier tant que la cause du démarrage n'est pas
   localisée. Si le serveur reste bloqué, donne les logs utiles, les étapes de
   reproduction et les diagnostics nécessaires; n'affirme pas que le problème
   est corrigé.

PHASE 2 — CORRECTION DU DÉMARRAGE ET DE LA LANDING

Corrige la cause identifiée avec le changement le plus réduit possible.
Vérifie notamment :
- que le plugin TanStack Start génère et charge `virtual:tanstack-start-server-entry` ;
- que l'entrée `src/server.ts` et le middleware de `src/start.ts` sont valides ;
- que les imports serveur ne tirent pas de modules exclusivement navigateur ;
- que la config de résolution des chemins n'active pas deux mécanismes en conflit ;
- que l'installation correspond aux versions verrouillées et n'est pas en train de
  recalculer un graphe incohérent.

Ne retire pas le plugin de chemins simplement à cause du warning. Si tu remplaces
`vite-tsconfig-paths` par `resolve.tsconfigPaths`, confirme que Vite et le wrapper
Lovable le supportent, retire réellement le plugin injecté au lieu de le doubler,
et valide le build SSR et le dev server.

La correction n'est terminée que si :
- le serveur démarre dans un délai raisonnable et annonce son URL ;
- un GET sur cette URL répond sans erreur serveur ;
- `/` affiche effectivement la landing dans un navigateur, sans page blanche ni
  erreur SSR/client ;
- le rechargement de `/` fonctionne.

PHASE 3 — DÉMO INTERNE TESTABLE PAR UN CLIENT

Après la stabilisation de `/`, vérifie le parcours de démo de bout en bout pour
un visiteur non authentifié :

1. Depuis la landing, le visiteur peut choisir un ou plusieurs modules et démarrer
   la démo sans créer de compte.
2. La session de démo est explicitement identifiée, isolée et limitée à sa durée
   prévue. Les données seedées restent dans le stockage local de démo et ne sont
   jamais envoyées à Supabase ni mélangées aux données d'un vrai compte.
3. L'arrivée sur `/dashboard` fonctionne en mode démo : les guards, hooks et
   services reconnaissent le mode démo sans demander une authentification réelle
   ni effectuer des requêtes métier non nécessaires.
4. Les écrans correspondant aux modules choisis présentent des données de démo
   cohérentes et les actions principales donnent un résultat compréhensible.
   Les erreurs de persistance doivent être visibles; ne simule pas un succès.
5. Le rafraîchissement de page conserve une session valide, la sortie de démo
   efface ses données et une session expirée est traitée clairement.
6. Clarifie le rôle de `/demo` (redirige, démarre ou affiche l'accès à la démo)
   en conservant le comportement intentionnel et les liens existants. Ne duplique
   pas le moteur de démo déjà présent.
7. Teste un contexte navigateur invité neuf puis un second démarrage de démo pour
   éviter les résultats trompeurs dus à une ancienne session ou à
   `sessionStorage`.

PHASE 4 — FONDATION VOCABULAIRE PAR SECTEUR

Applique la décision MVP Option A, sans attribuer de vocabulaire métier propre
au stock :
- `SectorModuleId` exclut à la fois `"multi-ateliers"` et `"consommables"` ;
- aucune clé `"consommables"` dans `SECTORS` ;
- `NEUTRAL_VOCABULARY` pointe vers un secteur métier réellement présent ;
- si `consommables` est actif seul, les hooks de vocabulaire retournent le fallback
  neutre, sans assertion non vérifiée ni erreur runtime.

Ne modifie pas les vocabulaires des six autres secteurs sauf si une erreur
TypeScript directement liée à cette correction l'exige. Vérifie qu'il n'y a pas
de type `ModuleId` dupliqué.

PHASE 5 — VALIDATION ET ITÉRATION

1. Lance et consigne la sortie réelle, avec le code de sortie, de :
   - `npm run type-check`
   - `npm run lint`
   - `npm run build`
2. Corrige les erreurs causées par tes changements et les erreurs bloquantes
   directement liées au démarrage ou à la démo. Pour les erreurs préexistantes
   non liées, indique fichier/ligne et sépare-les des résultats de ta correction;
   ne les masque pas et n'élargis pas le périmètre inutilement.
3. Après chaque correction, relance le contrôle concerné. Ne déclare pas une
   commande réussie si elle a été interrompue, a expiré ou n'a pas fourni de code
   de sortie.
4. Fais aussi un test navigateur automatisé ou manuel des URL `/`, `/demo`,
   `/auth` et `/dashboard` selon leur accès attendu. Pour la démo, teste réellement
   le parcours invité, pas seulement le code ou un build.
5. Si un outil de terminal ne répond pas, ne répète pas indéfiniment la même
   commande. Utilise un autre terminal disponible, vérifie les processus et
   retourne les erreurs exactes ainsi que ce qui n'a pas pu être validé.
6. Ne garantis pas qu'aucune erreur future n'existera. Mets en place et vérifie
   les contrôles pertinents existants (type-check, lint, build et test du parcours)
   pour détecter rapidement les régressions liées à ce travail.

RAPPORT FINAL OBLIGATOIRE

Fournis un rapport factuel et sans résultat inventé :
1. Cause racine confirmée du timeout/page blanche, ou indique explicitement
   « cause non déterminée » avec les éléments observés.
2. Fichiers modifiés et raison précise de chaque modification.
3. Versions installées, versions verrouillées et gestionnaire de paquets utilisé.
4. Résultat du démarrage, URL testée, temps de démarrage et résultat HTTP.
5. Résultat du rendu navigateur de `/` et du parcours de démo invité.
6. Vérification de `/demo`, `/auth` et `/dashboard`, avec résultat ou blocage.
7. Extrait final de `SectorModuleId`, clés de `SECTORS` et comportement du
   fallback neutre pour `consommables`.
8. Sortie brute et code de sortie de type-check, lint et build; signale toute
   commande non exécutée ou interrompue.
9. Liste des problèmes préexistants ou environnementaux encore ouverts, avec
   étapes concrètes pour les reproduire.
10. Confirmation que les changements non liés et les secrets ont été préservés.

Commence par le diagnostic et poursuis jusqu'à fournir un démarrage fonctionnel,
une landing affichée et une démo interne réellement testée, ou jusqu'à un blocage
documenté et reproductible. Ne t'arrête pas à une explication ou à un plan.
```
