# Audit du module Vente et de la vitrine en ligne

**Périmètre :** routes, composants, services, migrations Supabase et critères A à J.  
**État estimé : environ 38 % complet**, en donnant un poids égal aux dix sections et une demi-valeur aux éléments partiels. C'est une estimation de couverture fonctionnelle, pas une mesure de disponibilité en production.

## Résumé exécutif

### Ce qui existe et fonctionne

- La table `sales` couvre les ventes simples : produit, client, quantités, prix, photo et statuts.
- Les pages internes permettent de créer et lister des ventes, consulter les commandes non remises et voir les ventes déjà livrées.
- Le formulaire permet de choisir ou créer un client, d'ajouter une photo et de saisir le mode de paiement choisi.
- Les règles RLS de `sales` limitent les accès aux membres de l'atelier; l'upload photo est réservé aux membres.

### Ce qui est partiel

- Les filtres de la liste ne couvrent pas tous les statuts ni tous les types. Le service expose lecture, mise à jour et suppression, mais les actions d'édition et de suppression ne sont pas raccordées à l'interface.
- Le total est calculé à la soumission, mais n'est pas affiché en direct. Caractéristiques et notes ne sont pas renseignées.
- Commandes et livraisons réutilisent `sales`; le statut « prêt » n'a pas d'action dans l'interface et le suivi se limite à un statut.
- Wave, Orange Money, MTN et Moov sont des modes enregistrés, pas des paiements réellement exécutés. La simulation CinetPay existante concerne les abonnements, pas les ventes.

### Ce qui est manquant

- Vitrine publique, catalogue de produits, panier et parcours de commande en ligne.
- Tables `products`, `orders` et `order_items`.
- Paiements en ligne intégrés aux ventes et suivi client d'une commande.

## Détail par catégorie

### A. Table Supabase `sales`

| Champ | État | Observation |
|---|---|---|
| `id` | ✅ | UUID avec valeur par défaut. |
| `shop_id` | ✅ | Colonne présente, mais nullable dans la migration. |
| `activity_type` | ✅ | Valeurs téléphone, ordinateur et consommable. |
| `product_name` | ✅ | Requis. |
| `product_description` | ✅ | Présent. |
| `product_photo_url` | ✅ | URL de l'image produit. |
| `characteristics` | ✅ | Colonne JSONB; le formulaire ne la renseigne pas. |
| `quantity` | ✅ | Présent, défaut 1, mais nullable. |
| `unit_price` | ✅ | Présent et requis. |
| `total_price` | ✅ | Présent et requis. |
| `payment_status` | ✅ | `pending`, `paid`, `refunded`. |
| `payment_method` | ✅ | Espèces, Wave, Orange Money, MTN, Moov. |
| `delivery_status` | ✅ | `pending`, `ready`, `delivered`. |
| `client_id` | ✅ | Référence client nullable. |
| `client_name` | ✅ | Présent. |
| `client_whatsapp` | ✅ | Présent. |
| `notes` | ✅ | Présent, mais le formulaire enregistre `null`. |
| `created_by` | ✅ | Référence utilisateur nullable. |
| `created_at` | ✅ | Valeur par défaut, mais colonne nullable. |
| `updated_at` | ✅ | Valeur par défaut; pas de trigger SQL d'actualisation automatique. |

RLS est activé. Les politiques autorisent la lecture et la gestion par les membres de l'atelier. Le bucket `sales-product-photos` est public; l'upload est limité aux membres, sans limite de taille ou de type de fichier spécifiée dans cette migration.

### B. Liste des ventes (`/sales`)

| Critère | État | Détail |
|---|---|---|
| Affiche la liste | ✅ | Liste les ventes de la boutique courante. |
| Filtre par statut | ⚠️ | Filtre de livraison uniquement; pas de filtre par statut de paiement. |
| Filtre par type | ⚠️ | Le paramètre de route accepte `phone` et `computer`, pas `consumable`; pas de filtre interactif. |
| Recherche | ✅ | Recherche par nom de produit ou client. |
| Bouton « Nouvelle vente » | ✅ | Présent. |
| Image produit | ✅ | Image facultative, avec icône de remplacement. |
| Nom du produit | ✅ | Affiché. |
| Prix | ✅ | Total affiché. |
| Statut paiement | ✅ | Badge affiché. |
| Statut livraison | ✅ | Badge affiché. |
| Actions Voir / Modifier / Supprimer | ❌ | Aucune action UI; pas de page détail. Le service a des fonctions de lecture, mise à jour et suppression, non utilisées par la liste. |

La route affiche également le texte « Module en construction » sous la liste.

### C. Nouvelle vente (`/sales/nouveau`)

| Critère | État | Détail |
|---|---|---|
| Formulaire de création | ✅ | Création d'une vente dans `sales`. |
| Sélection du type | ✅ | Téléphone, ordinateur ou consommable. |
| Nom produit | ✅ | Champ requis. |
| Description | ✅ | Champ présent. |
| Upload photo produit | ✅ | Upload facultatif vers Supabase Storage. |
| Caractéristiques JSON | ❌ | Pas de champ; valeur créée fixée à `null`. |
| Quantité | ✅ | Champ présent, minimum 1. |
| Prix unitaire | ✅ | Champ présent. |
| Calcul automatique du total | ⚠️ | Calcul à la soumission; aucun total en direct visible. |
| Sélection client existant/nouveau | ✅ | Sélecteur et dialogue de création rapide. |
| Champ nom client | ⚠️ | Repris du client sélectionné, pas de saisie distincte dans le formulaire de vente. |
| Champ WhatsApp client | ⚠️ | Repris du client sélectionné, pas de saisie distincte dans le formulaire de vente. |
| Mode de paiement | ✅ | Espèces, Wave, Orange Money, MTN, Moov. Cela n'exécute pas le paiement. |
| Notes | ❌ | Pas de champ; valeur créée fixée à `null`. |
| Bouton Enregistrer | ✅ | Crée la vente avec paiement et livraison en attente. |

### D. Commandes (`/sales/commandes`)

| Critère | État | Détail |
|---|---|---|
| Liste des commandes en attente | ✅ | Montre les ventes dont la livraison n'est pas `delivered`, y compris les statuts `pending` et `ready`. |
| Filtres | ⚠️ | Filtres de livraison réutilisés; pas de filtre paiement ou type dédié. |
| Marquer prêt | ❌ | Aucune action d'interface ne passe la vente à `ready`. |
| Marquer livré | ✅ | Action « Marquer remise » disponible. |

### E. Livraisons (`/sales/livraisons`)

| Critère | État | Détail |
|---|---|---|
| Liste des livraisons | ⚠️ | Liste seulement les ventes déjà marquées `delivered`. |
| Suivi des livraisons | ⚠️ | Statuts et compteurs seulement; pas de transporteur, numéro de suivi ou historique. |
| Confirmation de livraison | ⚠️ | Possible depuis Commandes, pas depuis cette page. |

### F. Vitrine publique / boutique en ligne

| Critère | État |
|---|---|
| Page publique sans connexion | ❌ |
| URL personnalisée (ex. `/shop/masociete`) | ❌ |
| Catalogue public | ❌ |
| Grille de produits avec images | ❌ |
| Filtres par catégorie | ❌ |
| Recherche produits | ❌ |
| Page détail produit | ❌ |
| Bouton « Ajouter au panier » | ❌ |
| Panier fonctionnel | ❌ |
| Formulaire de commande client | ❌ |
| Choix du paiement en ligne | ❌ |
| Suivi de commande | ❌ |

### G. Table `products`

| Critère | État |
|---|---|
| Table Supabase | ❌ |
| Colonnes catalogue (nom, description, catégorie, prix, stock, images, etc.) | ❌ |
| RLS configuré | ❌ |
| Policies | ❌ |

### H. Table `orders`

| Critère | État |
|---|---|
| Table Supabase | ❌ |
| Colonnes client, total, paiement et livraison | ❌ |
| RLS configuré | ❌ |
| Policies | ❌ |

### I. Table `order_items`

| Critère | État |
|---|---|
| Table Supabase | ❌ |
| Colonnes `order_id`, `product_id`, quantité, prix unitaire et total | ❌ |
| RLS configuré | ❌ |

### J. Paiement Mobile Money

| Critère | État | Détail |
|---|---|---|
| Wave intégré aux ventes | ❌ | Option de saisie seulement. |
| Orange Money intégré aux ventes | ❌ | Option de saisie seulement. |
| MTN intégré aux ventes | ❌ | Option de saisie seulement. |
| Moov intégré aux ventes | ❌ | Option de saisie seulement. |
| API CinetPay intégrée aux ventes | ❌ | L'usage repéré est lié aux paiements d'abonnement. |
| Simulation de paiement vente | ⚠️ | `markAsPaid()` existe dans `salesService`, mais n'est appelé par aucune page. La simulation implémentée dans `paymentService` concerne les abonnements. |

## Fichiers concernés

### Fichiers existants à faire évoluer

- [src/components/SalesPages.tsx](../src/components/SalesPages.tsx)
- [src/services/salesService.ts](../src/services/salesService.ts)
- [src/routes/sales/index.tsx](../src/routes/sales/index.tsx)
- [src/routes/sales/nouveau.tsx](../src/routes/sales/nouveau.tsx)
- [src/routes/sales/commandes.tsx](../src/routes/sales/commandes.tsx)
- [src/routes/sales/livraisons.tsx](../src/routes/sales/livraisons.tsx)
- [src/routes/salles/commandes.tsx](../src/routes/salles/commandes.tsx), alias vers la même liste de commandes
- [supabase/migrations/20260927000001_sales.sql](../supabase/migrations/20260927000001_sales.sql)
- [src/services/paymentService.ts](../src/services/paymentService.ts), actuellement dédié aux abonnements

### Fichiers ou ressources à créer

- Migrations pour `products`, `orders`, `order_items` et leurs contraintes/policies RLS.
- Routes publiques de boutique, détail produit, panier et commande.
- Services catalogue, commande et paiement des ventes.
- Éventuelles fonctions serveur/webhooks pour confirmer les paiements.

## Prochaines étapes

1. Définir les champs produit, le slug de boutique, les statuts de commande et les règles d'accès public.
2. Construire le catalogue, le panier et la création de commande avec ses lignes.
3. Ajouter les vues et actions de suivi côté atelier.
4. Ajouter le paiement après définition des exigences serveur, webhooks et credentials du compte marchand.

## Estimation : délai cible de 3 jours

**Objectif proposé : livrer en 3 jours ouvrés un MVP de vitrine et de commande simple**, sous réserve que le périmètre soit limité, que les accès Supabase soient disponibles et que les décisions produit soient prises avant le démarrage.

| Jour | Cible |
|---|---|
| Jour 1 | Schéma minimal `products` / `orders` / `order_items`, policies RLS, services et statuts initiaux. |
| Jour 2 | Vitrine publique responsive : URL boutique, catalogue, images, recherche/catégorie et détail produit. |
| Jour 3 | Panier, formulaire de commande, enregistrement, confirmation et consultation côté atelier; tests de parcours et RLS. |

Ce délai vise un **MVP sans paiement Mobile Money réel**. Une confirmation manuelle ou un mode de démonstration peut être inclus si le temps le permet. CinetPay en production, webhooks sécurisés, remboursements et intégrations directes Wave/Orange Money/MTN/Moov demandent un chiffrage séparé et des accès marchand valides.

## Vérification

Audit statique des routes, composants, services et migrations du dépôt. `npm run type-check` s'est terminé sans erreur. Aucun fichier du module n'a été modifié pendant l'audit.
