# Prompt Lovable - Finalisation de GogoSoft Tools Manager

Copie-colle le prompt ci-dessous dans Lovable AI.

```text
CONTEXTE

Tu travailles sur le dépôt existant "GogoSoft Tools Manager", une application SaaS multi-tenant destinée aux réparateurs de téléphones en Côte d'Ivoire.

Stack imposée et déjà présente :
- React 19 + TypeScript strict
- Vite
- TanStack Router
- Supabase
- shadcn/ui + Tailwind CSS
- Lucide React
- npm/Bun selon l'environnement
- Déploiement Vercel

Le projet existe déjà. Il contient des routes, composants, services, hooks, migrations Supabase et un client Supabase configuré. Tu dois finaliser ce projet existant, pas en créer un nouveau.

OBJECTIF PRINCIPAL

Rendre l'application réellement utilisable en production pour une démonstration et un usage quotidien :
- toutes les données métier viennent de Supabase ;
- tous les CRUD fonctionnent réellement ;
- les données sont isolées par boutique avec RLS ;
- aucune donnée mockée, fallback statique ou écran simulé ne doit rester dans les parcours métier ;
- l'interface est professionnelle, cohérente, responsive et accessible ;
- le build TypeScript/Vite passe sans erreur ;
- l'application n'effectue aucune requête métier avant authentification et sélection d'une boutique.

REGLES ABSOLUES

1. Modifie directement les fichiers existants. Ne recrée pas les composants déjà présents.
2. Ne supprime jamais une fonctionnalité existante sans la remplacer par une implémentation fonctionnelle.
3. Ne réinitialise pas le dépôt, ne change pas de framework et ne remplace pas l'architecture par une autre.
4. N'utilise aucune donnée de démonstration dans les services ou les routes : pas de demoData, MOCK, FAKE, tableaux hardcodés pour simuler les résultats, ni valeurs de secours présentées comme des données réelles.
5. N'utilise pas le projet Supabase de Lovable. Utilise exclusivement le projet Supabase déjà configuré dans ce dépôt.
6. Ne remplace pas les variables d'environnement existantes par celles de Lovable.
7. Ne mets jamais de clé secrète Supabase dans le frontend. Utilise seulement la clé publique/publishable côté client.
8. Respecte les types générés et les migrations existantes. Si le schéma doit évoluer, ajoute une migration SQL versionnée dans supabase/migrations/.
9. Ne contourne jamais RLS avec une clé service dans le navigateur.
10. Après chaque groupe de modifications, lance une validation ciblée. À la fin, lance obligatoirement le type-check et le build.
11. Si une requête échoue, affiche une erreur utilisateur claire et journalise l'erreur technique, sans retourner silencieusement des données fictives.
12. Conserve les noms de tables et les contrats publics existants sauf nécessité démontrée.

ENVIRONNEMENT SUPABASE

Avant toute modification, inspecte le client existant dans src/integrations/supabase/client.ts et les variables utilisées par Vite.

Utilise les variables déjà définies par le projet :
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY ou la variable publique équivalente déjà utilisée dans client.ts

Ne crée pas de nouvelles variables Supabase avec des valeurs Lovable.
Ne remplace pas les valeurs présentes dans .env, .env.local ou dans la configuration Vercel.
Vérifie uniquement que les mêmes noms sont documentés dans .env.example si ce fichier existe.

AVANT DE CODER : AUDIT CIBLE

Inspecte d'abord :
- package.json
- src/integrations/supabase/client.ts
- src/integrations/supabase/types.ts
- src/types/database.ts
- src/router.tsx et src/routes/__root.tsx
- src/components/AppShell.tsx
- src/hooks/useAuth.tsx
- src/hooks/useCurrentShop.ts
- tous les fichiers de src/services/
- toutes les routes de src/routes/
- toutes les migrations de supabase/migrations/

Identifie les incohérences entre les services, les types TypeScript et les colonnes SQL avant de modifier le code.
Ne fais pas d'exploration interminable : après cet audit, passe à l'implémentation.

1. AUTHENTIFICATION ET DÉMARRAGE

Vérifie et finalise :
- connexion email/mot de passe ;
- inscription email/mot de passe avec nom et téléphone ;
- déconnexion ;
- persistance de session ;
- redirection vers /auth si aucune session ;
- redirection vers /boutiques/nouveau si l'utilisateur authentifié n'a aucune boutique ;
- protection des routes privées ;
- absence de requêtes métier sur /auth ;
- SplashScreen affiché une seule fois au premier chargement, sans ralentir les navigations suivantes.

Le helper de garde doit empêcher tout appel métier si la session est absente. Les requêtes Supabase doivent attendre que l'état d'authentification soit connu.

2. MODÈLE MULTI-TENANT

Le shop courant doit être chargé depuis Supabase et conservé dans localStorage uniquement comme préférence d'identifiant, jamais comme source de vérité.

Finalise useCurrentShop pour retourner :
- shop
- shopId
- shops
- switchShop
- loading

Règles :
- session absente : aucune requête de données, shops=[], shopId=null ;
- session présente : charger les boutiques appartenant à l'utilisateur ou auxquelles il est membre ;
- aucune boutique : état vide explicite ;
- boutique active : toujours vérifier qu'elle appartient à la liste chargée ;
- toute requête métier doit filtrer par shop_id quand la table est multi-tenant.

3. CRUD SUPABASE RÉELS

Finalise les services existants sans les dupliquer :
- authService
- shopService
- clientService
- workshopService
- toolService
- launchService
- historyService
- subscriptionService
- paymentService

Pour chaque fonction CRUD :
- typer explicitement les paramètres et le résultat ;
- vérifier la session avant l'appel ;
- exiger un shopId pour les données de boutique ;
- utiliser select/insert/update/delete Supabase réel ;
- vérifier error et la propager avec un message exploitable ;
- éviter les requêtes N+1 quand une requête Supabase raisonnable suffit ;
- ne jamais retourner de tableaux mockés en cas d'erreur ;
- afficher un état loading, empty ou error distinct.

Fonctionnalités minimales à garantir :
- créer, modifier, supprimer et lister une boutique ;
- gérer les membres d'une boutique selon leur rôle ;
- créer, modifier, supprimer et consulter un client ;
- créer, consulter, modifier le statut et supprimer une fiche d'atelier ;
- conserver le diagnostic, les pannes, les prix et notified_at ;
- créer et lister les outils ;
- lancer un outil et enregistrer l'historique ;
- gérer l'abonnement et les paiements avec des données Supabase ;
- générer les liens WhatsApp avec numéro nettoyé et message encodé ;
- consulter les templates WhatsApp et les audit logs selon les policies.

Vérifie particulièrement que WorkshopTicket est défini une seule fois, exporté correctement et aligné avec la table workshop_tickets, notamment le statut livre et la colonne notified_at.

4. SCHÉMA, MIGRATIONS ET RLS

Compare les types TypeScript aux migrations existantes.

Si une colonne ou une table réellement utilisée manque :
- ajoute une migration idempotente ;
- ajoute les index utiles sur shop_id, user_id et created_at ;
- active RLS ;
- ajoute les policies SELECT/INSERT/UPDATE/DELETE nécessaires ;
- vérifie qu'un membre autorisé ne voit que sa boutique ;
- vérifie que les utilisateurs non authentifiés n'ont aucun accès ;
- évite les policies dupliquées et les noms ambigus.

Tables métier à contrôler au minimum :
- shops
- shop_members
- subscriptions
- payments
- clients
- workshop_tickets
- tools
- tool_launches
- tool_logs
- whatsapp_templates
- audit_logs
- profiles

Ne modifie pas une migration déjà publiée de manière destructive. Ajoute une nouvelle migration corrective si nécessaire.

5. ROUTES ET INTERFACE

Finalise les routes existantes :
- /auth
- /
- /boutiques
- /boutiques/nouveau
- /atelier
- /atelier/nouveau
- /atelier/$id
- /clients
- /clients/nouveau
- /clients/$id
- /outils
- /outils/$id
- /equipe
- /historique
- /statistiques
- /abonnement
- /parametres
- /profil

Chaque page doit utiliser ses services Supabase et gérer :
- loading ;
- succès ;
- erreur ;
- liste vide ;
- confirmation avant suppression ;
- rafraîchissement après mutation ;
- navigation après création/modification/suppression.

Pour les empty states, utiliser le composant existant ou en créer un seul composant réutilisable, avec une icône Lucide, un texte court et une action utile. Ne pas afficher de chiffres inventés.

Pour les ToolCards :
- utiliser des icônes Lucide par catégorie ;
- conserver les badges catégorie/type ;
- afficher uniquement les actions réellement disponibles ;
- ne pas utiliser d'image fictive pour représenter un outil.

Pour le design :
- conserver le design system existant ;
- améliorer hiérarchie, espacement, contraste, responsive et états focus ;
- utiliser les images externes Unsplash uniquement pour des bannières ou l'écran de connexion, jamais pour des données métier ;
- prévoir alt text, lazy loading quand approprié et un rendu correct sur mobile ;
- ne pas ajouter de dashboard marketing ou de cartes décoratives inutiles.

6. DASHBOARD RÉEL

Le dashboard doit charger depuis Supabase :
- nombre de réparations ;
- réparations récentes ;
- nombre de clients ;
- clients récents ;
- abonnement courant ;
- activité récente si disponible.

Les statistiques doivent être calculées à partir des résultats réels. Si une table est vide, afficher un empty state, jamais 12, 184, 1 250 000 FCFA ou une autre valeur de démonstration.

7. GESTION DES ERREURS ET OBSERVABILITÉ

Ajoute une gestion cohérente :
- erreurs Supabase loguées avec le nom du service et de l'opération ;
- message utilisateur en français, sans exposer de secrets ;
- états retry lorsque pertinent ;
- pas de boucle infinie dans les useEffect ;
- pas de requête exécutée avant session/shop prêts ;
- pas de `auth.admin` côté navigateur.

8. SUPPRESSION DES MOCKS

Recherche dans tout src/ et supprime les usages métier de :
- demoData
- MOCK
- FAKE
- fake
- hardcoded
- tableaux de clients, tickets, boutiques, chiffres ou outils utilisés comme résultats.

Supprime src/lib/demoData.ts uniquement après avoir retiré tous ses imports et confirmé qu'il n'est plus nécessaire.
Ne supprime pas des constantes de configuration légitimes comme les labels de statuts, le catalogue des pannes ou les catégories d'outils.

9. VALIDATION OBLIGATOIRE

Exécute, dans cet ordre :
1. npm run type-check
2. npm run lint
3. npm run build

Corrige toutes les erreurs avant de terminer.

Vérifie également :
- aucune erreur TS4111, TS2459, TS2741, TS7053 ou TS7006 ;
- aucune importation de type non exportée ;
- aucune requête Supabase métier sur /auth ;
- aucun appel avec shop_id null ;
- aucun écran principal affichant des données inventées ;
- aucun secret dans le bundle client.

10. PARCOURS DE RECETTE

Teste manuellement le parcours suivant avec le projet Supabase existant :
1. ouvrir l'application déconnecté ;
2. vérifier la redirection vers /auth sans requête métier ;
3. créer un compte ;
4. créer une première boutique ;
5. vérifier l'apparition du dashboard vide ;
6. créer un client ;
7. créer une fiche d'atelier ;
8. modifier son statut ;
9. ouvrir le lien WhatsApp ;
10. vérifier la fiche dans l'historique ;
11. créer/modifier/supprimer un outil ;
12. vérifier les restrictions entre deux boutiques ;
13. tester l'abonnement et le rafraîchissement de son état ;
14. se déconnecter puis vérifier que les données privées ne sont plus chargées.

LIVRABLE FINAL

À la fin, ne réponds pas seulement avec une description. Donne :
- la liste précise des fichiers modifiés, créés et supprimés ;
- les migrations ajoutées et leur ordre d'exécution ;
- les commandes de validation exécutées et leur résultat ;
- les variables d'environnement attendues, sans révéler leurs valeurs ;
- les éventuels blocages nécessitant une action manuelle dans Supabase ou Vercel ;
- le parcours de démonstration final prêt à présenter.

Commence par auditer le code existant, puis implémente réellement toutes les corrections nécessaires. Ne t'arrête pas à un plan et ne laisse pas de pseudo-code.
```
