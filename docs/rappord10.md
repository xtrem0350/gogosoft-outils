# Rapport 10 — Refonte de l'accueil et déplacement de la landing marketing

## 1. Objectif

Cette vague a consisté à mettre en place la nouvelle logique d’entrée de l’application :

- l’accueil principal est devenu un écran unique inspiré de /auth ;
- la landing marketing a été déplacée vers /bienvenue ;
- la route /demo a été dépréciée en redirection vers / ;
- les règles public/private du root ont été ajustées pour inclure /bienvenue ;
- le mode démo existant a été conservé sans toucher au cœur SaaS ni à ActiveModulesContext.

## 2. Ce qui a été vérifié avant l’implémentation

Les fichiers de référence suivants ont bien été lus et utilisés comme base de décision :

- [src/routes/auth.tsx](../src/routes/auth.tsx)
- [src/routes/index.tsx](../src/routes/index.tsx)
- [src/routes/demo.tsx](../src/routes/demo.tsx)
- [src/routes/dashboard.tsx](../src/routes/dashboard.tsx)
- [src/routes/__root.tsx](../src/routes/__root.tsx)
- [src/contexts/ActiveModulesContext.tsx](../src/contexts/ActiveModulesContext.tsx)
- [src/services/demoService.ts](../src/services/demoService.ts)
- [src/hooks/useShopModules.ts](../src/hooks/useShopModules.ts)
- [src/hooks/useSubscription.ts](../src/hooks/useSubscription.ts)
- [src/components/SubscriptionGuard.tsx](../src/components/SubscriptionGuard.tsx)
- [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)
- [src/types/modules.ts](../src/types/modules.ts)
- [src/constants/pricing.ts](../src/constants/pricing.ts)

### Résumé de la référence /auth

Le design de /auth repose sur :

- fond d’écran avec image de couverture + overlay noir semi-transparent ;
- carte principale en verre/blanc sur fond sombre ;
- logo rond leprofile.png centré dans le panneau gauche ;
- titre “Atelier numérique” ;
- sous-titre : “Tous vos outils, au même endroit. Centralisez vos réparations, vos clients, vos diagnostics et l’activité de votre équipe.” ;
- structure 2 colonnes desktop ;
- bloc central avec max-w-5xl, rounded-3xl, card-3d, shadow-3d ;
- scroll interne sur le panneau droit via max-h + overflow-y-auto ;
- composants UI utilisés : Tabs, Input, Button, PasswordInput, AlertDialog, PricingModal.

## 3. Déplacement de la landing vers /bienvenue

La landing existante a été conservée mais déplacée vers une route dédiée :

- fichier créé : [src/routes/bienvenue.tsx](../src/routes/bienvenue.tsx)

Cette route :

- conserve le contenu marketing original ;
- intègre createFileRoute("/bienvenue") ;
- renomme la page en BienvenuePage ;
- garde les CTAs existants, avec adaptation vers / et /auth ;
- affiche le lien discret “← Retour à l’accueil” vers /.

## 4. Nouvelle page d’accueil en /

L’accueil principal a été refondu dans :

- [src/routes/index.tsx](../src/routes/index.tsx)

### Ce qu’il contient

- fond identique au style /auth ;
- image de couverture + overlay ;
- carte centrale claire, alignée sur la référence /auth ;
- trois blocs empilés dans le panneau principal :
  1. Choix des modules ;
  2. Offre mensuelle ;
  3. Actions principales (authentification + essai gratuit) ;
- grille de 6 modules avec sélection visuelle ;
- checkbox/selection persistée dans sessionStorage via la clé :
  gogosoft.welcome.selectedModules ;
- prix avec plan Pro mis en avant ;
- CTA Essai Gratuit désactivé si aucun module sélectionné ;
- message d’aide si aucune sélection n’est faite.

### Sélection des modules

La logique suit le schéma attendu :

- lecture depuis sessionStorage au montage ;
- persistance à chaque changement ;
- au moins un module requis pour activer le CTA d’essai ;
- persistance conservée si l’utilisateur clique sur “S’authentifier”.

## 5. Redirection /demo

Le fichier [src/routes/demo.tsx](../src/routes/demo.tsx) a été vérifié et conservé comme redirect dédié :

- beforeLoad avec redirect({ to: "/" }) ;
- route publique non supprimée ;
- compatibilité garantie avec anciens liens.

## 6. Ajustements du root /__root

Dans [src/routes/__root.tsx](../src/routes/__root.tsx), la liste des routes publiques a été complétée pour inclure :

- "/bienvenue"

Cela permet de sortir de l’AppShell pour les pages publiques sans casser l’expérience connectée du dashboard.

## 7. Protection et logique SaaS conservée

Les composants et hooks suivants n’ont pas été modifiés, conformément aux contraintes de sécurité et de design :

- [src/contexts/ActiveModulesContext.tsx](../src/contexts/ActiveModulesContext.tsx)
- [src/services/demoService.ts](../src/services/demoService.ts)
- [src/hooks/useShopModules.ts](../src/hooks/useShopModules.ts)
- [src/hooks/useSubscription.ts](../src/hooks/useSubscription.ts)
- [src/components/SubscriptionGuard.tsx](../src/components/SubscriptionGuard.tsx)
- [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)

### Points importants

- le mode démo continue d’utiliser sessionStorage uniquement ;
- aucun stockage Supabase n’est ajouté dans cette logique ;
- le multi-tenant est laissé intact ;
- la protection de route par auth/demo est conservée ;
- le système d’abonnement et les rôles existants n’a pas été altéré.

## 8. ModuleIds réels trouvés

Source : [src/types/modules.ts](../src/types/modules.ts)

```ts
export type ModuleId =
  | "reparation-telephone"
  | "reparation-pc"
  | "vente-telephone"
  | "vente-pc"
  | "consommables"
  | "vitrine-telephone"
  | "vitrine-pc"
  | "multi-ateliers";
```

## 9. Pricing

La constante [src/constants/pricing.ts](../src/constants/pricing.ts) a bien été utilisée :

```ts
export const WELCOME_PRICING = [
  { id: "essentiel", title: "Essentiel", price: 6000, subtitle: "1 module / mois", ... },
  { id: "pro", title: "Pro", price: 10000, subtitle: "2 modules / mois", featured: true, ... },
  { id: "vitrine", title: "Vitrine", price: 20000, subtitle: "Boutique en ligne / mois", ... },
] as const;
```

Le design de la page d’accueil a bien conservé le plan Pro mis en avant et le message domaine + SSL + Mobile Money.

## 10. Vérification de build et validation

Les commandes suivantes ont été lancées et exécutées sans erreur :

```bash
npm run type-check
npm run lint
npm run build
```

Résultat : exit code 0 pour les 3 vérifications.

## 11. Port de développement

Le serveur a été démarré sur le port attendu pour ce projet :

- http://localhost:8080

## 12. Conclusion

Cette vague a bien achevé la refonte d’entrée demandée :

- accueil unique sur / ;
- landing marketing conservée sur /bienvenue ;
- démo redirigée vers / ;
- structure public/private ajustée ;
- logique de démo préservée ;
- aucune régression logique côté SaaS / contexte / abonnement / droits.
