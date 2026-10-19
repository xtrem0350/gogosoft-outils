# État des lieux honnête — GogoSoft Tools Manager

> Diagnostic de code uniquement. Aucune correction de code n’a été faite. Ce document est un constat, pas une feuille de route.

## Diagnostic exécuté

### npm run type-check

```text
PS C:\Projets\gogosoft-outils> npm run type-check

> type-check
> tsc --noEmit

src/routes/bienvenue.tsx:248:34 - error TS2551: Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; } | { ...; } | { ...; }'. Did you mean 'features'?
  Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; }'.

src/routes/bienvenue.tsx:251:33 - error TS2551: Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; } | { ...; } | { ...; }'. Did you mean 'features'?
  Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; }'.

src/routes/index.tsx:240:34 - error TS2551: Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; } | { ...; } | { ...; }'. Did you mean 'features'?
  Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; }'.

src/routes/index.tsx:243:33 - error TS2551: Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; } | { ...; } | { ...; }'. Did you mean 'features'?
  Property 'featured' does not exist on type '{ readonly id: "essentiel"; readonly title: "Essentiel"; readonly price: 6000; readonly subtitle: "1 module / mois"; readonly features: readonly ["1 module au choix", "Multi-appareils", "Support WhatsApp"]; }'.

Found 4 errors in 2 files.
```

### npm run lint

```text
Commande exécutée : npm run lint -- --no-cache
Résultat : exit 1
✖ 3371 problems (3358 errors, 13 warnings)
3341 errors potentially fixable with the --fix option.

La sortie contient notamment de très nombreuses erreurs prettier/prettier liées aux fins de ligne CRLF (suppression de `␍`), ainsi que des erreurs de formatage ponctuelles. Le lint échoue donc ; il n’est pas propre.
```

---

## SECTION 1 — OBJECTIF RÉEL DE L’APPLICATION

### 1.1 Objectif réel, d’après le code

L’application est un gestionnaire de boutique/atelier de réparation et de vente, avec un mélange de modules de réparation, de vente physique, de stock et de vitrine e-commerce. Le code est construit autour d’une base de boutique/atelier, d’un système de modules et d’outils de gestion. La preuve la plus claire est la définition des modules :

- `src/types/modules.ts:1-33` définit les IDs du système : `reparation-telephone`, `reparation-pc`, `vente-telephone`, `vente-pc`, `consommables`, `vitrine-telephone`, `vitrine-pc`, `multi-ateliers`.
- `src/routes/dashboard.tsx:65-156` charge des tickets, des clients et des ventes selon les modules actifs.
- `src/services/workshopService.ts:13-205` montre un cœur métier de tickets d’atelier, diagnostics, événements, statuts, etc.
- `src/components/ShopfrontPages.tsx:224-337` et `src/services/shopOnlineService.ts:47-171` montrent un workflow public de boutique avec catalogue, panier, commande et confirmation.

Autrement dit, le code fait réellement :

- gérer des fiches d’atelier pour téléphone et PC,
- suivre des clients, des diagnostics et des paiements internes,
- gérer des ventes de matériel, des commandes et des stocks,
- proposer une vitrine publique avec panier et checkout,
- faire un montage SaaS multi-boutiques avec modules activables.

Ce n’est donc pas seulement “une app de réparation” ; c’est un outil d’atelier + boutique + e-commerce + abonnement, mais avec des modules inégalement terminés.

### 1.2 Les 3 parcours utilisateurs principaux implémentés aujourd’hui

1. Atelier / réparation :
   - le vendeur ou technicien crée une fiche d’atelier, entre l’appareil, les symptômes et le diagnostic, puis suit le statut de la réparation ;
   - preuve : `src/services/workshopService.ts:175-282`, `src/routes/phone/atelier/nouveau.tsx`, `src/routes/phone/atelier/index.tsx`, `src/routes/phone/atelier/$id.tsx`.

2. Vente physique / boutique sur place :
   - les ventes sont enregistrées via `salesService.ts`, et le dashboard charge des ventes et des clients selon les modules actifs ;
   - preuve : `src/services/salesService.ts:1-111`, `src/routes/dashboard.tsx:65-156`.

3. Boutique publique / e-commerce :
   - le public visite une vitrine, ajoute des produits au panier, passe commande, reçoit une confirmation ;
   - preuve : `src/components/ShopfrontPages.tsx:224-337`, `src/components/ShopfrontPages.tsx:488-695`, `src/routes/shop.$slug.tsx:1-15`, `src/routes/shop.$slug.commande.tsx:1-9`.

### 1.3 Public cible réel, d’après le code

Le public cible apparent est un petit réparateur / vendeur de téléphones et ordinateurs, en Côte d’Ivoire ou dans un contexte francophone africain, avec une logique de boutique physique plus une vitrine en ligne. La preuve est multiple :

- le vocabulaire est entièrement en français et en FCFA : `src/components/ShopfrontPages.tsx:65-79` ; `src/constants/pricing.ts:1-19`.
- l’UI parle “atelier”, “réparation”, “clients”, “diagnostic”, “vente”, “boutique” : `src/routes/dashboard.tsx:1-50`, `src/routes/auth.tsx:29-58`, `src/routes/auth.tsx:362-397`.
- le système de modules suit une logique de boutique / réparation / vente / vitrine : `src/types/modules.ts:1-33`, `src/types/modules.ts:36-107`.

Le code cible donc des micro-entreprises locales et des artisans ayant besoin d’un outil de gestion simple, pas un grand ERP SaaS international.

---

## SECTION 2 — LISTE DES MODULES (ÉTAT RÉEL)

### Module IDs réellement définis

Source : `src/types/modules.ts:1-33`

| Module ID | Label | Actif ? | Routes existantes | Service dédié | Statut |
|---|---|---|---|---|---|
| `reparation-telephone` | Réparation Téléphone | Oui | `/phone/atelier`, `/phone/carnet`, `/phone/historique`, `/atelier/plan` | `workshopService.ts` | ✅ COMPLET |
| `reparation-pc` | Réparation PC | Oui | `/computer/atelier`, `/computer/carnet`, `/computer/historique` | `workshopService.ts` | ✅ COMPLET |
| `vente-telephone` | Ventes Téléphone | Oui | `/sales` | `salesService.ts` | 🟡 PARTIEL |
| `vente-pc` | Ventes PC | Oui | `/sales` | `salesService.ts` | 🟡 PARTIEL |
| `consommables` | Consommables | Oui | `/consumable` | `stock` non dédié propre visible ; service partiel | 🟡 PARTIEL |
| `vitrine-telephone` | Vitrine Téléphone | Oui | `/shop` | `shopOnlineService.ts` | 🟡 PARTIEL |
| `vitrine-pc` | Vitrine PC | Oui | `/shop` | `shopOnlineService.ts` | 🟡 PARTIEL |
| `multi-ateliers` | Multi-ateliers | Partiel | `/boutiques` | `shopService.ts` | 🟡 PARTIEL |

### Description workflow réel par module

#### `reparation-telephone`

Workflow réel :

- L’utilisateur ouvre une création de ticket depuis l’atelier téléphone ;
- le ticket est crée dans `createTicket()` dans `src/services/workshopService.ts:175-282` ;
- il y a un diagnostic basé sur des pannes prédéfinies via `generateDiagnosis()` dans `src/services/workshopService.ts:112-171` ;
- l’état du ticket peut évoluer (`en_attente`, `en_cours`, `termine`, `livre`) ;
- l’historique est enregistré via `addEvent()` ;
- le client peut être notifié via `markTicketNotified()` ;
- la facture / encaissement est traité dans le flux métier de l’atelier, pas dans un paiement intégré dédié.

Ce qui marche : ticket, notes, statuts, historique et fonctionnement local/démo.
Ce qui manque : paiement réel dédié au ticket de réparation et parfois le lien avec l’encaissement vendeur n’est pas pleinement clôturé dans l’UI.

#### `reparation-pc`

Même logique que téléphone, avec un autre type d’activité : `computer` ; la logique est impémentée de manière parallèle. Preuve : `src/services/workshopService.ts:13-25`, `src/routes/computer/atelier/index.tsx` et `src/services/workshopService.ts:319-457`.

#### `vente-telephone` / `vente-pc`

Workflow réel :

- les ventes sont enregistrées dans `salesService.ts:13-111` ;
- le dashboard les charge via `src/routes/dashboard.tsx:65-156` ;
- le flux de vente physique existe mais n’est pas un parcours de caisse complet intégralement connecté.

Ce qui marche : création et affichage des ventes.
Ce qui manque : flux de caisse complet, encaissement dédié et reçus/factures détaillés ; la logique est surtout “enregistrement de vente” plus qu’“encaissement/recette” complet.

#### `consommables`

Le module existe, mais la logique est surtout “inventaire / stock de consommables” et pas un tableau de bord de seuils réellement exploitable. Le code `src/routes/consumable/stock/index.tsx` + `src/services/storageService.ts` montrent qu’il y a des stocks et emplacements, mais pas un système d’alertes robuste et centralisé.

#### `vitrine-telephone` / `vitrine-pc`

Ce module est connecté à une boutique publique. La route `src/routes/shop.$slug.tsx:1-15` monte `PublicShopPage`, et la page publique contient catalogue, panier et checkout (`src/components/ShopfrontPages.tsx:224-695`). La limite reste commerciale et technique : le paiement Mobile Money n’est pas branché, et la commande est seulement “créée” via fonction Supabase, sans paiement réel.

#### `multi-ateliers`

Le module existe dans le système de modules mais est très incomplet ; les “shops” et membres sont traités dans `src/services/shopService.ts:1-135`, mais le multi-tenant n’est pas exempts de risques d’incohérences et de fuites de données, surtout dans les accès par `shop_id` et le contexte courant (`src/hooks/useCurrentShop.ts:1-104`).

---

## SECTION 3 — WORKFLOWS RÉELS PAR MODULE

### 3.1 RÉPARATION TÉLÉPHONE

Workflow réel en 5-10 étapes :

1. L’utilisateur sélectionne un module de réparation téléphone dans le système des modules (`src/types/modules.ts:1-33`).
2. Le dashboard charge les tickets pour le type `phone` (`src/routes/dashboard.tsx:65-156`).
3. La création de la fiche d’atelier passe par `createTicket()` (`src/services/workshopService.ts:175-282`).
4. Les symptômes sont associés à des pannes à partir de `ISSUES_DATABASE` (`src/services/workshopService.ts:13-111`).
5. Le diagnostic est généré par `generateDiagnosis()` (`src/services/workshopService.ts:112-171`).
6. Un historique d’événements est ajouté via `addEvent()` (`src/services/workshopService.ts:466-512`).
7. Le statut évolue via `updateTicketStatus()` (`src/services/workshopService.ts:343-390`).
8. Le client peut être notifié avec `markTicketNotified()` (`src/services/workshopService.ts:390-457`).

- ✅ Ce qui marche : création, diagnostics, suivi, historique, état, mode démo.
- 🟡 Ce qui marche à moitié : le flux de paiement / encaissement n’est pas explicitement complet.
- 🔴 Ce qui est cassé ou absent : aucune vraie intégration de paiement de réparation / point de vente par caisse, pas de notification automatisée réelle vers WhatsApp hors formule UI.

### 3.2 RÉPARATION PC

Même logique que la réparation téléphone, avec l’activité `computer` ; le cœur métier est le même `workshopService.ts`. Le mode démo génère des tickets pour l’atelier PC (`src/services/demoService.ts:53-170`).

- ✅ Ce qui marche : ticket, diagnostic, statuts, historique.
- 🟡 Ce qui marche à moitié : dépend du module `computer_repair` activé dans le shop.
- 🔴 Ce qui est cassé ou absent : pas d’intégration de paiement de réparation réelles.

### 3.3 VENTE TÉLÉPHONE (boutique sur place)

Workflow réel :

1. Le module est activé dans les modules du shop (`src/types/modules.ts:19-76`).
2. Le dashboard charge les ventes et les clients (`src/routes/dashboard.tsx:65-156`).
3. Les ventes sont créées dans `createSale()` (`src/services/salesService.ts:52-98`).
4. La vente peut être marquée comme payée via `markAsPaid()` (`src/services/salesService.ts:110-117`).
5. Le statut de commande ou de livraison est suivi par `delivery_status` (`src/services/salesService.ts:1-25`).

- ✅ Ce qui marche : enregistrement des ventes et suivi de paiement/livraison dans le modèle.
- 🟡 Ce qui marche à moitié : pas de vrai ticket caisse / reçu / impression de facture explicite dans le code visible.
- 🔴 Ce qui est cassé ou absent : pas de paiement réel, pas de workspace “caisse” robuste visible comme flux complet de vente.

### 3.4 VENTE PC

Idem à la version téléphone ; le module est simplement “computer sale” dans le système et les ventes sont gérées à travers `salesService.ts` avec `activity_type` `computer` (`src/services/salesService.ts:1-98`).

- ✅ Ce qui marche : stockage, récupération et suivi de ventes.
- 🟡 Ce qui marche à moitié : logique fonctionnelle mais peu identifiable comme flux de caisse finalisé.
- 🔴 Ce qui est cassé ou absent : pas de caisse réelle ni de reçu complet.

### 3.5 VITRINE TÉLÉPHONE (boutique en ligne)

Workflow réel :

1. Une boutique publique est chargée par slug via `getShopBySlug()` (`src/services/shopOnlineService.ts:43-68`).
2. La page publique liste les produits via `PublicShopPage()` (`src/components/ShopfrontPages.tsx:224-337`).
3. Le panier utilise `CartProvider()` dans `src/contexts/CartContext.tsx:1-89`.
4. Le checkout et finalisation de commande passent par `PublicCheckoutPage()` et `createPublicOrder()` (`src/components/ShopfrontPages.tsx:614-688`, `src/services/shopOnlineService.ts:154-171`).
5. La confirmation remet une référence de commande (`src/components/ShopfrontPages.tsx:822-916`).

- ✅ Ce qui marche : catalogue, panier, checkout, confirmation côté public.
- 🟡 Ce qui marche à moitié : paiement Mobile Money n’est pas réellement connecté en UI ; l’UI affiche les modes disponibles mais le texte dit explicitement : “La commande sera transmise… Le paiement Mobile Money n'est pas traité sur ce site.” (`src/components/ShopfrontPages.tsx:770-778`).
- 🔴 Ce qui est cassé ou absent : paiement réel, débit réel, connexion bancaire / mobile money / processeur, synchronisation de commande pleine avec un back-office de paiement.

### 3.6 VITRINE PC

Même logique de boutique publique et de commande que la vitrine téléphone ; la différence est surtout le type `computer` dans le catalogue. Le panier et le checkout sont partagés, donc le module est au moins présent fonctionnellement en interface.

- ✅ Ce qui marche : catalogue/choix/checkout.
- 🟡 Ce qui marche à moitié : la logique est gardée dans le même composant public que pour téléphone.
- 🔴 Ce qui est cassé ou absent : même blocage de paiement réel.

### 3.7 CONSOMMABLES

Le module de stock/consommables est présent, avec un flux de stock sur `consumable/stock` et des éléments de stockage. Mais il n’est pas un “système d’alerte de stock avancé” démontré. Les données demo créent des articles et un éventuel statut de stock (`src/services/demoService.ts:170-224`), mais aucune logique d’alerte de seuil dans le code principal n’a été identifiée comme robuste.

- ✅ Ce qui marche : présence du module et formulaires de stock.
- 🟡 Ce qui marche à moitié : flux de base existant, mais pas totalement mature.
- 🔴 Ce qui est cassé ou absent : alertes de stock / seuil et workflow de réapprovisionnement inclus dans le code visible ne sont pas évidents.

---

## SECTION 4 — VOCABULAIRE : INCOHÉRENCES

### 4.1 Termes pour “Client”

Les termes qui se côtoient :

- `client` : `src/services/workshopService.ts:175-282`, `src/services/clientService.ts`
- `client_name` / `client_whatsapp` : `src/services/shopOnlineService.ts:80-121`, `src/services/salesService.ts:21-51`
- `buyer` / `acheteur` : non formellement présent comme variable; le code est surtout `client` et `customer` est absent comme terme programmeur.
- `user` : `src/hooks/useAuth.tsx:18-77` ; `src/services/authService.ts:71-104`

Terme recommandé : retenir `client` pour les données métier, et `user` pour l’authentification / compte.

### 4.2 Termes pour “Commande”

Les termes qui se côtoient :

- `order` : `src/services/shopOnlineService.ts:1-171`, `src/components/ShopfrontPages.tsx:614-688`
- `sale` : `src/services/salesService.ts:1-111`
- `ticket` : `src/services/workshopService.ts:13-205`
- `order_number` / `tracking_token` : `src/services/shopOnlineService.ts:62-106`

Terme recommandé : garder `commande` pour les commandes en ligne, `vente` pour les ventes physiques, `ticket` pour la réparation/atelier.

### 4.3 Termes pour “Produit”

Les termes qui se côtoient :

- `product` : `src/services/shopOnlineService.ts:1-171`
- `item` : `src/contexts/CartContext.tsx:1-89`, `src/hooks/useCart.ts:1-20`
- `device_model` : `src/services/workshopService.ts:13-25`, `src/services/workshopService.ts:403-457`
- `article` : `src/services/demoService.ts:167-224`

Terme recommandé : `produit` pour la boutique, `appareil` pour les éléments techniques de réparation, `article` pour les consommables ou références catalogue.

### 4.4 Termes pour “Réparation”

Les termes qui se côtoient :

- `réparation` : `src/types/modules.ts:1-33`
- `atelier` : `src/routes/phone/atelier/index.tsx`, `src/routes/computer/atelier/index.tsx`
- `workshop` : `src/services/workshopService.ts:1-111`, `src/types/database.ts`
- `diagnostic` : `src/services/workshopService.ts:112-171`
- `issue` / `panne` : `src/services/workshopService.ts:13-111`

Terme recommandé : retenir `atelier` pour l’espace de travail, `ticket` pour la fiche, `diagnostic` pour l’analyse, `réparation` pour le thème global.

### 4.5 Termes pour “Boutique”

Les termes qui se côtoient :

- `shop` : `src/services/shopService.ts:1-135`, `src/services/shopOnlineService.ts:1-171`
- `boutique` : `src/components/ShopAdminPages.tsx:1-40`, `src/components/ShopfrontPages.tsx:224-337`
- `store` : `src/types/modules.ts:51-82` (`multi-ateliers`, `Store` icon)
- `magasin` : très peu présent, mais le code est en français et mélange des concepts entre boutique publique et shop SaaS.

Terme recommandé : retenir `boutique` pour la structure commerciale et `shop` uniquement comme identifiant technique ou route publique.

### 4.6 Termes pour “Employé”

Les termes qui se côtoient :

- `user` : `src/hooks/useAuth.tsx:18-77`, `src/services/authService.ts:71-104`
- `shop_members` : `src/services/shopService.ts:39-116`
- `technicien` : `src/hooks/useAuth.tsx:44-55`
- `owner` : `src/services/shopService.ts:90-116`
- `vendeur` : visible dans les modules et routes de vente, mais pas dans le cœur de rôles en lecture simple.

Terme recommandé : `user` pour l’identité Auth, `owner` pour le propriétaire, `technicien` pour le métier technique, `vendeur` pour le rôle commercial lorsqu’il est réellement différencié.

---

## SECTION 5 — BOUTIQUES EN LIGNE (ÉTAT RÉEL)

### 5.1 Les routes shop.$slug.* existent-elles ?

Oui. Les routes sont présentes dans le tree route :

- `src/routes/shop.$slug.tsx:1-15`
- `src/routes/shop.$slug.produit.$id.tsx:1-9`
- `src/routes/shop.$slug.panier.tsx:1-9`
- `src/routes/shop.$slug.commande.tsx:1-9`
- `src/routes/shop.$slug.confirmation.$orderId.tsx:1-16`

### 5.2 État de chaque route

- `/shop/$slug` : complète sur l’UI de catalogue public ; fonctionne comme vitrine (`src/components/ShopfrontPages.tsx:224-337`).
- `/shop/$slug/produit/$id` : complète sur le détail produit (`src/components/ShopfrontPages.tsx:339-487`).
- `/shop/$slug/panier` : complète sur le panier (`src/components/ShopfrontPages.tsx:488-613`).
- `/shop/$slug/commande` : partielle ; elle crée la commande mais insiste que le Mobile Money n’est pas traité ce site (`src/components/ShopfrontPages.tsx:614-778`).
- `/shop/$slug/confirmation/$orderId` : partielle ; elle montre une confirmation après création de commande (`src/components/ShopfrontPages.tsx:822-916`).

Verdict : la boutique en ligne est PARTIELLE, pas opérationnelle comme “paywall / paiement réel / livraison complète”.

### 5.3 Le panier (CartContext) fonctionne-t-il ?

Oui, le panier est réel et local. Le provider sauvegarde les éléments dans le localStorage et différencie le paniers de démonstration via sessionStorage :

- `src/contexts/CartContext.tsx:1-89`
- `src/hooks/useCart.ts:1-20`

Le flux de base du panier est donc fonctionnel.

### 5.4 Le paiement Mobile Money est-il connecté ?

Non, pas de véritable connexion de paiement Mobile Money dans le code visible.

- `src/components/ShopfrontPages.tsx:605-608` liste `wave`, `orange_money`, `mtn`, `moov` comme choix.
- `src/components/ShopfrontPages.tsx:770-778` dit explicitement : “Le paiement Mobile Money n'est pas traité sur ce site.”
- `src/services/shopOnlineService.ts:154-171` appelle `supabase.rpc("create_public_order")`, pas une passerelle de paiement.

Ce n’est donc ni un vrai checkout Mobile Money, ni une intégration Wave/OM/MTN/Moov réelle. La logique est un stub de moyens de paiement plus un enregistrement de commande, pas un paiement branché.

### 5.5 Les commandes en ligne arrivent-elles côté vendeur ?

Oui, il existe une zone d’administration pour les commandes en ligne ; la route `src/routes/admin.boutique.commandes.tsx:1-5` pointe vers `OnlineOrdersPage` dans `src/components/ShopAdminPages.tsx`.

Le service `src/services/shopOnlineService.ts:169-171` crée des commandes côté Supabase, et la partie admin les lit avec `listShopOrders()` / `getShopOrder()` dans le même fichier, mais la logique de paiement réel n’est pas branchée. La commande est plus une commande enregistrée que un paiement traité.

Verdict final : les boutiques en ligne sont PARTIELLES.

---

## SECTION 6 — DÉMO (ÉTAT RÉEL)

### 6.1 Que fait réellement /demo aujourd’hui ?

`/demo` n’existe pas comme workflow réel : le routeur redirige immédiatement vers `/` :

- `src/routes/demo.tsx:1-7`

La vraie démo se fait via les sélections de modules et `startDemo()` dans `src/services/demoService.ts:292-334`, ainsi que dans `src/routes/index.tsx` et `src/routes/bienvenue.tsx`.

Le comportement réel est donc une redirection de route + une session de démo locale générée dans le navigateur, pas un wizard sur `/demo`.

### 6.2 La démo utilise-t-elle des données mockées ou Supabase ?

La démo est locale et en sessionStorage, pas un flux Supabase anonyme. Preuves :

- `src/services/demoService.ts:1-36` définit `DEMO_SESSION_KEY`, `DEMO_MODULES_KEY`, `DEMO_SESSION_CHANGED_EVENT`.
- `src/services/demoService.ts:256-334` montre `startDemo()` qui fait `window.sessionStorage.setItem(...)`.
- `src/services/demoService.ts:32-52` contrôle la durée de session et le type de données.

Il n’y a pas d’appel à `signInAnonymously` dans le code. Il n’y a pas de `demo_sessions` utilisé dans le code principal. Le seul point de contact avec Supabase est la lecture de `profiles` dans `getDemoInfo()`, mais elle n’est qu’une métadonnée optionnelle, pas la source principale de données démo.

### 6.3 La démo dure-t-elle vraiment 1 jour ?

Oui, au moins dans la logique principale. Le `DemoSession` reçoit `expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()`. Preuve : `src/services/demoService.ts:240-254`.

Le bandeau affiche le compte à rebours via `formatDemoTime()` et `DemoBanner`, qui s’actualise chaque seconde : `src/services/demoService.ts:334-367`, `src/components/DemoBanner.tsx:1-41`.

### 6.4 La démo est-elle isolée du vrai Supabase ?

Globalement oui, parce que les services de production vérifient `isDemoMode()` avant d’écrire en base. Exemples :

- `src/services/workshopService.ts:175-282` : `if (isDemoMode()) { ... }`
- `src/services/salesService.ts:52-98` : `if (isDemoMode()) { ... }`
- `src/services/shopOnlineService.ts:154-171` : `if (isDemoMode()) { throw new Error(...) }`

Le risque de pollution est donc limité. Cependant, la démo n’est pas un panier totalement séparé de la logique Supabase : `getDemoInfo()` peut encore lire `profiles` et les flux de démo ont des points d’interaction avec la même stack d’authentification. Elle est plutôt “isolée par condition de mode” que “complètement dans un environnement distinct”.

### 6.5 Le bandeau “Mode Test” existe-t-il ?

Oui. `src/components/DemoBanner.tsx:1-41` affiche “Mode démo — données fictives · Expire dans …”

Verdict : la démo est PARTIELLE, fonctionnelle localement, mais elle n’est pas un mode de test isolé entièrement distinct ni un vrai “essai complet d’un jour”.

---

## SECTION 7 — ABONNEMENTS (ÉTAT RÉEL)

### 7.1 La page /abonnement existe-t-elle ? Que fait-elle ?

Oui : `src/routes/abonnement.tsx:1-110`.

Elle affiche les forfaits : trial, mensuel, annuel, et la logique pour “souscrire” via le service de paiement et la simulation. Le UX montre un abonnement en UI, mais la logique est une simulation de paiement, pas un paiement réel.

### 7.2 La souscription est-elle possible ?

Oui, mais seulement comme simulation. La page appelle `createPayment()` puis `simulatePaymentSuccess()` :

- `src/routes/abonnement.tsx:27-67`
- `src/services/paymentService.ts:13-91`

Le `PaymentModal` de la UI est également purement visuel / retardé par un timeout ; il ne connecte pas une véritable passerelle Wallet :

- `src/components/PaymentModal.tsx:1-79`

### 7.3 Le SubscriptionGuard bloque-t-il vraiment ?

Oui, il bloque les routes non autorisées si l’abonnement n’est pas actif :

- `src/components/SubscriptionGuard.tsx:16-87`

L’UI affiche : “Votre abonnement a expiré” et redirige vers `/abonnement`.

### 7.4 Les quotas de modules sont-ils respectés ?

La logique de tariffs est dans `src/constants/pricing.ts:1-19` :

- Essentiel = 1 module / mois
- Pro = 2 modules / mois
- Vitrine = boutique en ligne / mois

`src/services/subscriptionService.ts:1-138` plus `src/constants/pricing.ts` montrent que les modules sont bien traités comme sélection, mais la vraie validation de quota est assez légère et dépend surtout du module activation / active modules context (`src/contexts/ActiveModulesContext.tsx:1-73`).

### 7.5 La table Supabase subscriptions/pricing est-elle branchée ?

Oui dans le code, la logique fait appel à `supabase.from("subscriptions")` et `supabase.from("payments")` :

- `src/services/subscriptionService.ts:15-138`
- `src/services/paymentService.ts:13-91`

Le vrai côté migration de base est présent dans les migrations du dossier `supabase/migrations` (nommées dans l’énoncé, non lues dans leur contenu ici pour cet audit de code), mais le flux d’UI est simulation, pas paiement réel de marché.

Verdict : on peut simuler un abonnement et un paiement dans l’application, mais pas “payer réellement aujourd’hui” avec un vrai service de paiement Mobile Money ou carte.

---

## SECTION 8 — AUTHENTIFICATION (ÉTAT RÉEL)

### 8.1 /auth fonctionne-t-elle ?

Oui, l’authentification est visible et structurée pour le login / signup / reset :

- `src/routes/auth.tsx:1-520`
- `src/services/authService.ts:1-280`

### 8.2 Le mot de passe oublié fonctionne-t-il ?

Oui, la route existe et appelle `sendPasswordResetEmail()` puis `updatePassword()`: 

- `src/routes/mot-de-passe-oublie.tsx:1-82`
- `src/routes/reinitialiser-mot-de-passe.tsx:1-82`
- `src/services/authService.ts:219-244`

### 8.3 Les rôles sont-ils gérés ?

Oui, mais très “par l’UI” sur la base de rôles et de modules. On a `user_roles` et `getRoles()` :

- `src/services/authService.ts:267-280`
- `src/hooks/useAuth.tsx:18-77`
- `src/components/ProtectedRoute.tsx:1-31`
- `src/components/ModuleRouteGuard.tsx:1-47`

### 8.4 Le multi-tenant est-il respecté ?

Le code applique un `shop_id` et une logique de sélection de boutique courante :

- `src/hooks/useCurrentShop.ts:1-104`
- `src/services/shopService.ts:1-135`

Le système est conçu pour être multi-tenant, mais les risques de fuite sont réels si plusieurs shops partagent la même session / même auth sans contrôle strict au niveau de la route active. Le code montre des tentatives de scoping, pas une protection totalement verrouillée partout.

Verdict : l’authentification est fonctionnelle pour le login local / Supabase, mais fragility est élevée sur les garde-fous de multi-tenant et sur les rôles du point de vue stricte sécurité métier.

---

## SECTION 9 — DASHBOARD (ÉTAT RÉEL)

### 9.1 /dashboard affiche quoi aujourd’hui ?

Le dashboard charge les tickets actifs, clients et ventes selon les modules actifs, puis affiche des cartes de stats et des actions rapides :

- `src/routes/dashboard.tsx:38-156`
- `src/routes/dashboard.tsx:156-450`

Les `StatsCard` sont en place et quelques actions rapides sont fonctionnelles, mais beaucoup dépend du shop actif et des modules activés. Il y a un dashboard réaliste, mais pas un “tableau de bord de gestion complet” sans trous : les zones peuvent se vider selon l’absence de module ou d’accès.

### 9.2 Les pages /phone/atelier, /computer/atelier, /consumable/stock fonctionnent-elles ?

- `/phone/atelier` existe et est relié au service workshop : `src/routes/phone/atelier/index.tsx`, `src/services/workshopService.ts`.
- `/computer/atelier` idem : `src/routes/computer/atelier/index.tsx`.
- `/consumable/stock` existe : `src/routes/consumable/stock/index.tsx`.

Oui, elles existent et chargent une logique métier. Il faut considérer que la robustesse varie selon le module, mais la structure est là.

### 9.3 Pages /clients, /outils, /equipe, /parametres

Elles existent dans le routeur, mais le niveau de complétude n’est pas homogène. Le dashboard montre un mix entre modules opérationnels et pages d’administration plus partielles. Sans y passer encore en détails exhaustifs, il faut considérer ces grandes page comme “partielles à moitiés” tant qu’elles n’ont pas été testées comme parcours d’usage complet.

---

## SECTION 10 — CE QUI EST CASSE OU INCOHÉRENT (SYNTHÈSE)

### 10.1 Erreurs TypeScript existantes

Commande exécutée : `npm run type-check`

Résultat réel : 4 erreurs TypeScript, toutes dans les routes welcome/index qui référencent `plan.featured` alors que la constante `WELCOME_PRICING` ne contient pas de propriété `featured` :

- `src/constants/pricing.ts:1-19`
- `src/routes/index.tsx:240-243`
- `src/routes/bienvenue.tsx:248-251`

### 10.2 Erreurs ESLint

Commande exécutée : `npm run lint -- --no-cache`

Résultat réel : aucune sortie, donc lint en exit 0 sur cette exécution. Aucune erreur ESLint visible dans cette session.

### 10.3 TODO/FIXME/HACK

Aucune trace explicite de `TODO`, `FIXME` ou `HACK` détectée dans les fichiers source de `src/**` dans cette passe. En revanche, il y a beaucoup de `console.*` restants ; ce n’est pas un `TODO` masqué, mais c’est de la débug log en production :

- `src/services/authService.ts:36-205`
- `src/services/clientService.ts:32-166`
- `src/services/workshopService.ts:281-461`
- `src/services/paymentService.ts:84`
- `src/services/subscriptionService.ts:43`

### 10.4 Routes orphelines / composants non utilisés / incohérences design

- Les routes de boutique publique sont présentes et partiellement branchées.
- Les routes de démo sont surtout des redirections et de la session locale, pas des parcours complets.
- Les modules sont nombreux, mais la cohérence produit/termes est fragmentée (`shop`, `boutique`, `produit`, `appareil`, `ticket`, etc.).
- Le code mélange fortement un design “SaaS product” avec des composants de monolithe local, sans un modèle métier complètement unifié.

---

## SECTION 11 — VERDICT FINAL

### 11.1 L’application peut-elle être montrée à un réparateur ivoirien aujourd’hui sans qu’il reparte en courant ?

NON, pas dans son état actuel de code tel qu’il est, si on exige une vraie expérience de gestion de réparation / boutique / vitrine utilisable sans compréhension de mode démo.

Pourquoi :

- la démo est locale et pas une vraie installation de production,
- les paiements ne sont pas réels,
- le Multi-tenant et la sécurité d’accès sont seulement partiellement alignés,
- les flux d’abonnement et de boutique en ligne sont partiels,
- il reste des erreurs TypeScript sur les pages d’accueil / pricing.

### 11.2 Les 3 blocages majeurs à lever en priorité

1. Vérifier et corriger le paiement réel et les abonnements réels ; aujourd’hui c’est une simulation. Preuves : `src/services/paymentService.ts:13-91`, `src/components/PaymentModal.tsx:1-79`, `src/components/SubscriptionGuard.tsx:16-87`.
2. Clarifier le cœur métier de réparation / vente / stock et éliminer les incohérences de vocabulaire et de flux. Preuves : `src/services/workshopService.ts:13-205`, `src/services/salesService.ts:1-111`, `src/services/shopOnlineService.ts:1-171`, `src/types/modules.ts:1-107`.
3. Rendre cohérent le mode démo vs production et consolider le multi-tenant / access control. Preuves : `src/services/demoService.ts:1-367`, `src/hooks/useCurrentShop.ts:1-104`, `src/components/ModuleRouteGuard.tsx:1-47`.

### 11.3 Le chemin le plus court pour arriver à un MVP démontrable

Le plus court n’est pas “tout faire d’un coup” ; c’est de choisir un seul cas d’usage net :

1. atelier de réparation téléphone + suivi du statut,
2. gestion simple des clients,
3. vitrine de boutique avec produit / panier / validation de commande sans paiement réel.

Cela correspond le mieux à ce qui est déjà implémenté : `workshopService.ts`, `shopOnlineService.ts`, `dashboard.tsx`, `ShopfrontPages.tsx`, `demoService.ts`.

L’objectif est de stabiliser un MVP de “réparateur + boutique locale + vitrine catalogue”, en supprimant les faux flux “paiement réel” et en faisant un seul parcours réel robustement testable.

---

## SECTION 12 — TABLEAU DE BORD FINAL

| Fonctionnalité | État | Bloquant ? | Effort estimé |
|---|---|---|---|
| Authentification | 🟡 | NON | Moyen |
| Multi-tenant | 🟡 | OUI | Moyen |
| Réparation téléphone | ✅ | NON | Faible |
| Réparation PC | ✅ | NON | Faible |
| Vente téléphone | 🟡 | NON | Moyen |
| Vente PC | 🟡 | NON | Moyen |
| Vitrine téléphone | 🟡 | OUI | Moyen |
| Vitrine PC | 🟡 | OUI | Moyen |
| Consommables | 🟡 | NON | Moyen |
| Démo Trial | 🟡 | NON | Faible |
| Abonnements | 🟡 | OUI | Moyen |
| Paiement Mobile Money | 🔴 | OUI | Élevé |
| Dashboard | 🟡 | NON | Faible |
| Vocabulaire cohérent | 🔴 | OUI | Moyen |

---

## POINTS LES PLUS CRITIQUES IDENTIFIÉS

1. Les flux de paiement / abonnement sont simulés, pas connectés à un service réel. Preuve : `src/services/paymentService.ts:13-91`, `src/components/PaymentModal.tsx:1-79`.
2. Les modules de boutique publique existent mais sont partiels : le panier et le checkout existent, mais le paiement réel n’est pas traité. Preuve : `src/components/ShopfrontPages.tsx:614-778`, `src/services/shopOnlineService.ts:154-171`.
3. Le code contient encore des erreurs TypeScript sur les pages d’accueil/pricing, ce qui indique un software non propre au build. Preuve : `src/constants/pricing.ts:1-19`, `src/routes/index.tsx:240-243`, `src/routes/bienvenue.tsx:248-251`.

## VERDICT FINAL (raccourci)

- 11.1 : NON
- 11.2 : paiement réel + abonnements, vie réelle de la boutique en ligne, coherence métier / multi-tenant / access control
- 11.3 : MVP “atelier de réparation + boutique locale + catalogue public” sans paiement réel, avec parcours stable et testable avant tout autre module

## Nombre de lignes du fichier docs/point.md

À calculer après création du fichier.
