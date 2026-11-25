# GogoSoft Tools Manager — Guide de démarrage
## Comment gagner de l'argent avec GogoSoft

> **Guide pédagogique, chiffres illustratifs.** Les prix des abonnements ci-dessous proviennent des règles tarifaires du projet. Les prix de vente, coûts d'achat, volumes et marges des ateliers sont des hypothèses à remplacer par vos vrais chiffres. GogoSoft enregistre les encaissements et mouvements; il ne calcule pas automatiquement le bénéfice net complet (salaires, loyer, impôts, transport et autres charges restent à intégrer).

## 1. Vue d'ensemble

GogoSoft Tools Manager regroupe la gestion des ateliers de réparation et des boutiques de vente : clients, fiches, équipe, catalogue, stock, caisse, paiements et suivi des livraisons. Une boutique active utilise les domaines correspondant à son activité.

Les trois profils de ce guide sont indépendants :

| Profil | Activité et ville | Domaine choisi | Équipe de démonstration |
|---|---|---|---|
| **Owner A** | Atelier de réparation téléphone, Abidjan | Réparation téléphone | Mariam (réception), Kouassi (technicien), Aya (caisse) |
| **Owner B** | Atelier de réparation PC, Bouaké | Réparation PC | Adama (réception), Serge (technicien), un caissier |
| **Owner C** | Boutique de vente PC, Yamoussoukro | Vente PC | Ibrahim (vendeur), Fatou (caisse), Bakary (magasin) |

Il faut séparer deux activités financières :

1. **Le chiffre d'affaires de chaque boutique** : réparations ou ventes réglées par ses clients.
2. **Le chiffre d'affaires de GogoSoft** : les abonnements et options effectivement payés à GogoSoft.

Les exemples de bénéfice de ce guide sont des **marges avant charges fixes**. Ils ne constituent ni une promesse de revenu ni un calcul de bénéfice net fourni par le logiciel.

### À confirmer avant d'utiliser ce guide comme offre commerciale

- Les sources tarifaires n'ont pas de forfaits nommés **Starter** ou **Pro**, ni de limites affichées « 1 boutique / 1 utilisateur » et « 2 boutiques / 5 utilisateurs ». Les offres actuellement définies sont « 1 domaine » et « 3 domaines », plus une tarification par modules et un forfait Tout-en-un.
- Le texte de la page d'accueil annonce **1 journée gratuite**, tandis que les règles tarifaires et le service d'abonnement définissent **7 jours d'essai**. Ne promettez pas une durée d'essai sans vérifier le parcours mis en production.
- La page d'accueil parle d'un domaine `.com`; l'écran de paiement demande un domaine du type `monatelier.ci`. Le prix configuré est de **10 000 FCFA/an**. Vérifiez le suffixe et le prix affichés sur la facture avant de communiquer une offre.
- Un produit vendu dans le formulaire actuel correspond à **un produit du catalogue par vente**. Une commande contenant deux références se saisit donc en deux ventes distinctes.
- Le remboursement d'un frais d'entrée d'atelier n'est pas automatisé par le flux de paiement de vente. Il doit suivre la politique de la boutique et être enregistré séparément à la caisse.

## 2. Étape 1 — Souscription et paiement (Jour J)

### 2.1 Choisir les domaines et le tarif réel

Depuis `gogosoft-outils.vercel.app`, l'utilisateur arrive à l'accueil, sélectionne les domaines correspondant à son activité, puis crée son compte. Les domaines disponibles incluent Réparation Téléphone, Réparation PC, Vente Téléphone et Vente PC; les vitrines Téléphone et PC sont aussi proposées.

Pour les trois profils, le scénario de base choisit **un domaine d'activité** :

- Owner A : Réparation Téléphone.
- Owner B : Réparation PC.
- Owner C : Vente PC.

Les tarifs mensuels affichés par les constantes du projet sont :

| Offre configurée | Prix |
|---|---:|
| 1 domaine | 15 000 FCFA/mois |
| 3 domaines | 35 000 FCFA/mois |
| Tout-en-un — les quatre domaines réparation/vente téléphone et PC | 49 000 FCFA/mois |
| Module d'activité supplémentaire | 15 000 FCFA; réduction de 10 % lorsque plusieurs modules de la même catégorie sont comptés |
| Domaine personnalisé | 10 000 FCFA/an |
| Pack SMS illimités + WhatsApp API, optionnel | 15 000 FCFA |

Pour un seul domaine, le prix de référence du scénario est donc **15 000 FCFA/mois**. Le calcul du paiement est construit à partir de :

`prix du plan × nombre de mois + prix du domaine + montant des options`

Le parcours d'une nouvelle boutique peut demander un nom de domaine et ajouter **10 000 FCFA/an**. Ainsi, l'hypothèse utilisée dans le tableau financier plus bas est : **15 000 FCFA pour le premier mois + 10 000 FCFA de domaine annuel = 25 000 FCFA au premier paiement**, puis 15 000 FCFA à chacun des deux renouvellements mensuels. Le domaine n'est pas refacturé chaque mois.

> Les valeurs réellement facturées sont celles de la facture générée par l'application. Les offres « Starter/Pro » du scénario initial ne doivent pas être annoncées comme des produits configurés tant qu'elles n'apparaissent pas dans l'écran et la tarification en production.

### 2.2 Enregistrer l'achat et faire valider le paiement

1. Le propriétaire remplit les informations demandées pour son compte et sa boutique, puis choisit son plan, sa durée et, si nécessaire, son domaine.
2. Il choisit le paiement : **Espèces, Wave, Orange Money ou MTN MoMo**. Pour un paiement mobile, la référence de transaction est obligatoire.
3. GogoSoft crée une facture dans `subscription_invoices` avec le statut **en attente de validation**. La création de la facture ne signifie pas que le paiement est déjà confirmé.
4. Le SuperAdmin ouvre `/admin/paiements`, contrôle le montant et la réception réelle des fonds, choisit le mode réellement encaissé et valide. Pour le mobile money, il confirme également la référence.
5. La validation appelle le flux `validate_cash_payment`; celui-ci doit confirmer l'activation et la date d'expiration. Le propriétaire peut ensuite utiliser l'abonnement et finaliser l'accès à sa boutique.

Le service de paiement refuse une confirmation autonome par le client : la validation est réservée au SuperAdmin. L'écran d'attente annonce qu'une notification sera envoyée, mais le guide ne doit pas présenter une notification automatique comme garantie de livraison; le SuperAdmin peut aussi contacter le propriétaire depuis la page des paiements.

### 2.3 Première facture de chaque propriétaire

Hypothèses communes : un domaine d'activité, plan à 15 000 FCFA/mois, domaine annuel à 10 000 FCFA sur la première facture, aucun pack SMS.

| Propriétaire | Plan mensuel | Domaine annuel | Première facture illustrative |
|---|---:|---:|---:|
| Owner A — Réparation Téléphone | 15 000 | 10 000 | **25 000 FCFA** |
| Owner B — Réparation PC | 15 000 | 10 000 | **25 000 FCFA** |
| Owner C — Vente PC | 15 000 | 10 000 | **25 000 FCFA** |

La facture peut être réglée en espèces ou par paiement mobile; elle reste en attente jusqu'à sa validation par le SuperAdmin.

## 3. Étape 2 — Configuration de la boutique (Jour J+1)

Chaque owner se connecte, vérifie le nom, l'adresse et le téléphone de sa boutique, puis invite son équipe depuis **Équipe** (`/equipe`). L'invitation contient un rôle et un code à transmettre au collaborateur; les invitations non utilisées expirent après 24 heures.

### Owner A — Atelier téléphone à Abidjan

1. Vérifier les coordonnées de l'atelier et le domaine Réparation Téléphone.
2. Dans les rangements, créer cinq emplacements :
   - Placard A / Étagère 1 / Casier 1
   - Placard A / Étagère 1 / Casier 2
   - Placard A / Étagère 2 / Casier 1
   - Placard B / Étagère 1 / Tiroir 1
   - Placard B / Étagère 1 / Tiroir 2
3. Inviter Mariam comme **réceptionniste**, Kouassi comme **technicien** et Aya comme **caissière**.
4. Configurer les frais d'entrée à **2 000 FCFA**, activés et non remboursables dans ce scénario. Le montant par défaut du service est 2 000 FCFA, mais le propriétaire doit vérifier le réglage de sa boutique.

### Owner B — Atelier PC à Bouaké

1. Vérifier les coordonnées et activer Réparation PC.
2. Créer cinq emplacements adaptés aux ordinateurs, par exemple Placard A / Étagère 1 / Casier 1 à 3 et Placard B / Étagère 1 / Casier 1 à 2.
3. Inviter Adama comme réceptionniste, Serge comme technicien et un collaborateur comme caissier.
4. Configurer les frais d'entrée à **5 000 FCFA**. Activer l'option « remboursable » uniquement si la politique réelle de l'atelier prévoit le remboursement du diagnostic.

Le parcours `/reception` consulté est orienté réception téléphone. Pour les fiches PC, le propriétaire et l'équipe utilisent les écrans de l'activité Réparation PC; ne pas supposer que le formulaire téléphone crée une fiche PC.

### Owner C — Boutique PC à Yamoussoukro

1. Vérifier les coordonnées et activer Vente PC.
2. Dans le catalogue de vente, enregistrer 20 produits avec leur prix réel, leur quantité initiale, leur catégorie et leur disponibilité. Quelques références du scénario :

   | Produit d'exemple | Prix de vente illustratif | Stock initial |
   |---|---:|---:|
   | HP EliteBook | 250 000 FCFA | 10 |
   | Dell Latitude | À définir avec le fournisseur | 8 |
   | MacBook Air | À définir avec le fournisseur | 5 |
   | Chargeur universel | 15 000 FCFA | 50 |
   | Souris | 10 000 FCFA | À définir |

   Les prix ci-dessus sont des exemples de démonstration, pas des tarifs imposés par GogoSoft.
3. Inviter Ibrahim comme vendeur, Fatou comme caissière et Bakary comme magasinier.
4. Utiliser des coûts d'achat réels pour suivre les marges en dehors du calcul de vente. Le catalogue vendu et le stock des pièces d'atelier sont deux suivis distincts.

## 4. Étape 3 — Flux métier (Jour J+2 à J+30)

### Owner A — Cycle 1 : écran d'iPhone 12 cassé

1. M. Koné apporte son iPhone 12.
2. Mariam sélectionne ou crée le client, crée une fiche téléphone, choisit la panne « écran cassé » et attribue l'emplacement prévu.
3. La fiche passe par l'encaissement des frais d'entrée de **2 000 FCFA** si ceux-ci sont activés.
4. Kouassi prend en charge la fiche, établit un devis total de **45 000 FCFA** et communique le devis au client. Le statut de devis peut être suivi dans la fiche; l'envoi d'un message WhatsApp reste à effectuer via le canal prévu.
5. Après acceptation, il commande l'écran, met la fiche en attente de pièce si nécessaire, puis reprend la réparation à réception.
6. Il termine la réparation et transmet la fiche à la caisse.
7. Aya ouvre la session de caisse, encaisse le solde de **43 000 FCFA** (45 000 − 2 000 déjà réglés), génère le reçu, puis la réception remet l'appareil et clôture la fiche.

**Calcul du cycle :** le prix final de 45 000 FCFA est traité comme le prix total de la réparation, frais d'entrée compris. Il ne faut donc pas additionner 2 000 + 45 000. Avec une pièce achetée 25 000 FCFA : **CA = 45 000 FCFA; coût de pièce = 25 000 FCFA; marge avant charges fixes = 20 000 FCFA.**

### Owner A — Cycle 2 : batterie défectueuse sous garantie

1. Un client revient pour une batterie qui ne tient plus et présente sa garantie.
2. Mariam marque la prise en charge sous garantie; le parcours encode cette information dans la description de la fiche. Les frais d'entrée sont mis à zéro.
3. Kouassi effectue le contrôle et la réparation couverte.
4. Aya clôture le passage en caisse à **0 FCFA** si aucun montant n'est dû; la réception rend l'appareil.

**Calcul du cycle :** CA client supposé à 0 FCFA. La marge est aussi de 0 FCFA uniquement si aucune pièce ou main-d'œuvre n'est comptabilisée comme coût. Une pièce remplacée peut représenter un coût réel pour l'atelier, même si elle est gratuite pour le client.

### Owner A — Cycle 3 : connecteur de charge

1. Un client apporte un téléphone dont le connecteur de charge est défectueux.
2. Mariam crée la fiche et encaisse l'avance de 2 000 FCFA.
3. Kouassi diagnostique, annonce un prix total de **30 000 FCFA**, puis remplace le connecteur après acceptation.
4. Aya encaisse le solde de **28 000 FCFA**; la réception remet l'appareil après clôture.

**Calcul du cycle :** avec une pièce à 12 000 FCFA, **CA = 30 000 FCFA; marge avant charges fixes = 18 000 FCFA.**

### Owner B — Cycle 1 : PC qui ne démarre pas, devis refusé

1. Mme Traoré apporte un PC HP qui ne démarre plus.
2. Adama crée la fiche PC et l'associe à un emplacement.
3. Serge diagnostique une panne possible de carte mère et prépare un devis de **80 000 FCFA**.
4. La cliente refuse le devis. Le technicien consigne le refus; aucun travail de réparation n'est facturé.
5. Si les 5 000 FCFA d'entrée ont déjà été encaissés et que la boutique a configuré ces frais comme remboursables, le responsable rembourse la cliente et enregistre la sortie correspondante dans la caisse. **Ce remboursement d'entrée n'est pas une opération automatisée du service de vente**; le motif et la traçabilité doivent être vérifiés manuellement.
6. La réception organise la remise du PC sans réparation selon le processus de la boutique. Ne pas compter sur le statut « devis refusé » pour déclencher à lui seul un remboursement ou une remise automatique.

**Calcul du cycle :** 5 000 FCFA encaissés puis 5 000 FCFA remboursés donnent **0 FCFA de recette nette** et **0 FCFA de marge**, avant tout coût de diagnostic ou déplacement.

### Owner B — Cycle 2 : remplacement d'un disque dur

1. M. Bamba apporte un PC avec disque dur défaillant.
2. Adama crée la fiche et encaisse les 5 000 FCFA d'entrée.
3. Serge diagnostique le disque, communique un prix total de **35 000 FCFA**, puis effectue l'intervention après acceptation.
4. Le prix total comprend l'avance : la caisse encaisse le solde de **30 000 FCFA**. La fiche est ensuite remise au client.

**Calcul du cycle :** avec une pièce à 15 000 FCFA, **CA total = 35 000 FCFA; marge avant charges fixes = 20 000 FCFA.**

### Owner B — Cycle 3 : entretien pour surchauffe

1. Un client signale que son ordinateur chauffe anormalement.
2. Adama ouvre une fiche; Serge nettoie le système de ventilation et remplace la pâte thermique si nécessaire.
3. Le prix total annoncé est de **25 000 FCFA**, dont les 5 000 FCFA d'entrée déjà encaissés.
4. La caisse reçoit le solde de **20 000 FCFA** et la réception remet le PC.

**Calcul du cycle :** si les consommables coûtent 2 000 FCFA, **CA = 25 000 FCFA; marge avant charges fixes = 23 000 FCFA.**

### Owner C — Cycle 1 : vente d'un HP EliteBook

1. M. Yao choisit un HP EliteBook à **250 000 FCFA**.
2. Ibrahim sélectionne le client, le produit et la quantité 1. Le formulaire refuse une quantité supérieure au stock disponible.
3. La vente est créée en attente de paiement et de préparation. Dans le parcours de production, la création utilise le RPC de vente avec stock : vérifier que ce RPC est déployé et compatible avant de lancer une vraie vente.
4. Ibrahim transmet la vente à Fatou. Elle ouvre la caisse et confirme le paiement; la vente passe à « payée ».
5. Fatou génère le reçu de vente; l'envoi WhatsApp est disponible si le numéro client est valide.
6. Ibrahim marque la commande « prête », informe le client, puis la marque « livrée » après remise.

**Calcul du cycle :** pour un coût d'achat de 180 000 FCFA, **CA = 250 000 FCFA; marge brute illustrative = 70 000 FCFA.** Le paiement doit être confirmé avant de considérer le montant comme encaissé.

### Owner C — Cycle 2 : accessoires, deux ventes distinctes

Le formulaire actuel saisit un seul produit par vente. Pour Mme Koffi, Ibrahim crée donc deux lignes de vente séparées :

1. **Deux chargeurs** à 15 000 FCFA chacun : total 30 000 FCFA.
2. **Une souris** à 10 000 FCFA : total 10 000 FCFA.
3. Il transmet les deux ventes à Fatou. Chaque paiement est confirmé à la caisse; les produits sont remis après préparation.

**Calcul commun :** CA total des deux ventes = **40 000 FCFA**. Si les coûts d'achat totalisent 25 000 FCFA, la marge brute illustrative est de **15 000 FCFA**.

### Owner C — Cycle 3 : vente d'un Dell Latitude

1. Un client demande un Dell Latitude affiché au prix réel du catalogue.
2. Ibrahim confirme la disponibilité, choisit le client, crée la vente et la transmet à Fatou.
3. Fatou confirme l'encaissement. Ibrahim prépare l'ordinateur, puis confirme la livraison.

**Exemple chiffré :** pour un prix de vente de 300 000 FCFA et un coût d'achat de 220 000 FCFA, **marge brute illustrative = 80 000 FCFA**. Remplacer ces valeurs par les prix d'achat et de vente réels.

## 5. Étape 4 — Récapitulatif financier sur trois mois

### Hypothèse de volume constante

Pour rendre la démonstration comparable, les mêmes volumes mensuels sont répétés pendant trois mois. C'est une simulation pédagogique, pas une prévision.

| Boutique | Activité par mois | CA mensuel illustratif | Coûts directs mensuels | Marge brute mensuelle |
|---|---:|---:|---:|---:|
| Owner A — téléphone | 25 réparations | 1 250 000 FCFA | 450 000 FCFA | **800 000 FCFA** |
| Owner B — PC | 15 réparations | 750 000 FCFA | 250 000 FCFA | **500 000 FCFA** |
| Owner C — vente PC | 40 ventes | 3 500 000 FCFA | 2 500 000 FCFA | **1 000 000 FCFA** |

Ces totaux incluent les avances d'entrée une seule fois dans le prix total de réparation. Les remboursements éventuels doivent être retranchés des recettes nettes; les pièces utilisées doivent être comptées dans les coûts directs une seule fois.

### Résultat cumulé de chaque boutique

| Boutique | CA sur 3 mois | Coûts directs sur 3 mois | Marge brute sur 3 mois |
|---|---:|---:|---:|
| Owner A | 3 750 000 FCFA | 1 350 000 FCFA | **2 400 000 FCFA** |
| Owner B | 2 250 000 FCFA | 750 000 FCFA | **1 500 000 FCFA** |
| Owner C | 10 500 000 FCFA | 7 500 000 FCFA | **3 000 000 FCFA** |

### Abonnements et marge après abonnement

Hypothèse : une offre « 1 domaine » à 15 000 FCFA/mois par owner, domaine annuel à 10 000 FCFA facturé au premier paiement, aucun pack SMS.

| Boutique | Mois 1 (plan + domaine) | Mois 2 | Mois 3 | Abonnement et domaine sur la période | Marge brute moins ces paiements |
|---|---:|---:|---:|---:|---:|
| Owner A | 25 000 | 15 000 | 15 000 | **55 000 FCFA** | **2 345 000 FCFA** |
| Owner B | 25 000 | 15 000 | 15 000 | **55 000 FCFA** | **1 445 000 FCFA** |
| Owner C | 25 000 | 15 000 | 15 000 | **55 000 FCFA** | **2 945 000 FCFA** |

Pour GogoSoft, ces trois scénarios représentent **165 000 FCFA de paiements facturés sur la période** : 45 000 FCFA de plans par owner et 30 000 FCFA de domaines annuels au total. Ce chiffre n'est reconnu comme encaissé qu'après validation effective des factures.

Pour les boutiques, la somme des marges brutes illustratives est de 6 900 000 FCFA. Après les 165 000 FCFA d'abonnements et domaines, il resterait **6 735 000 FCFA avant salaires, loyers, impôts, transport, autres charges et éventuels remboursements**. Ce n'est pas un bénéfice net comptable.

Dans GogoSoft, la caisse récapitule les paiements atelier, les ventes réglées et certaines entrées manuelles; les sorties apparaissent séparément. La marge indiquée dans ce guide est donc à rapprocher des achats de pièces, marchandises et dépenses enregistrés par chaque boutique.

## 6. Étape 5 — Renouvellement (vers J+30 et J+60)

1. Le propriétaire consulte **Abonnement** (`/abonnement`) et vérifie le statut ainsi que la date d'expiration.
2. Il choisit le renouvellement pour **1 ou 3 mois**. Un mois correspond à 30 jours; trois mois à 90 jours.
3. Il choisit Espèces, Wave, Orange Money ou MTN MoMo. Pour un paiement mobile, il renseigne la référence.
4. Une nouvelle facture est créée avec le statut en attente. L'accès n'est pas activé par la simple création de cette facture.
5. Le SuperAdmin vérifie le paiement dans `/admin/paiements`, puis le valide. Le RPC de validation doit retourner le nouvel abonnement et sa date d'expiration.

Pour l'exemple à trois paiements mensuels, Owner A, B et C règlent chacun 15 000 FCFA au renouvellement de J+30, puis de J+60. Leur domaine annuel n'est pas refacturé à ces deux échéances. Une option SMS ou un module supplémentaire augmente le montant; utiliser le montant de la facture réelle, pas le tableau illustratif.

## 7. Étape 6 — Développer l'activité

- **Owner A** peut étudier l'ouverture d'une seconde boutique à Abidjan. Les règles de prix lues ne spécifient pas de quota « une boutique » ou « deux boutiques » : vérifier l'accès et les conditions du compte avant de promettre cette capacité.
- **Owner B** peut demander l'ajout de Vente PC dans l'abonnement. L'ajout d'un domaine ou d'un module est soumis au flux de facturation et à la validation applicable.
- **Owner C** peut ajouter Vitrine PC et développer la vente en ligne. Un domaine additionnel est proposé à 10 000 FCFA/an; la création et l'activation du domaine sont conditionnées à la disponibilité et à la validation du paiement.
- Les pièces utilisées en réparation sont suivies par le stock atelier (`stock_items`). Le stock des produits vendus dépend du catalogue de vente (`products`) et du RPC de création de vente. Ne pas supposer qu'un ajustement dans l'un modifie automatiquement l'autre.
- Les paiements et sorties de caisse peuvent être exportés en CSV, Excel ou PDF depuis la caisse. Le rapprochement des coûts directs et des charges externes reste à faire par la boutique.

## 8. Conclusion

GogoSoft peut aider chaque propriétaire à organiser ses clients, interventions, ventes, équipe et encaissements. Dans le scénario, trois boutiques génèrent des recettes distinctes, tandis que leurs factures d'abonnement contribuent au chiffre d'affaires de GogoSoft.

La démonstration financière est crédible si elle distingue :

- le **montant facturé**, le **montant effectivement payé** et les **sorties**;
- l'avance d'entrée et le prix total d'une réparation, sans compter deux fois la même somme;
- la marge brute et le bénéfice net après les charges réelles;
- les produits de vente et les pièces de stock atelier;
- les capacités confirmées dans l'application et les hypothèses commerciales à valider.

## 9. Annexe — Tarifs configurés dans le projet

| Élément | Valeur source |
|---|---:|
| Offre « 1 domaine » | 15 000 FCFA/mois |
| Offre « 3 domaines » | 35 000 FCFA/mois |
| Tout-en-un | 49 000 FCFA/mois |
| Prix unitaire de module | 15 000 FCFA |
| Réduction modules de même catégorie à partir de deux | 10 % |
| Domaine | 10 000 FCFA/an |
| Pack SMS + WhatsApp API | 15 000 FCFA |
| Durée prise en charge par le paiement | 1 ou 3 mois, soit 30 ou 90 jours |
| Essai défini par les règles tarifaires/service | 7 jours |

**Attention :** la page `/bienvenue` indique actuellement « 1 journée gratuite » et mentionne `.com`, tandis que les constantes indiquent 7 jours et que le checkout demande un domaine `.ci`. Résoudre ces divergences avant de publier une brochure tarifaire.

## 10. Annexe — Rôles et responsabilités

| Rôle | Actions métier illustrées |
|---|---|
| **Owner** | Gérer la boutique et l'équipe, consulter l'activité, configurer les frais d'entrée, ouvrir/fermer et administrer la caisse selon les droits accordés. |
| **Réceptionniste** | Enregistrer les clients et réceptions, attribuer un rangement, suivre les fiches en attente et remettre l'appareil après clôture. |
| **Technicien** | Prendre en charge les fiches assignées, diagnostiquer, renseigner le devis, signaler l'attente de pièces, terminer la réparation et transmettre à la caisse. |
| **Caissier** | Ouvrir la session, encaisser les entrées, soldes et ventes, enregistrer les sorties autorisées, produire les reçus et contribuer au récapitulatif. |
| **Magasinier** | Suivre les articles et seuils, gérer les inventaires, commandes fournisseurs et mouvements de stock atelier. |
| **Vendeur** | Sélectionner un produit et un client, créer une vente, la transmettre à la caisse, préparer la commande et confirmer la livraison. |

Les invitations prennent en charge les rôles technicien, caissier, magasinier, réceptionniste et vendeur. Les actions effectives restent soumises au rôle actif, à l'accès de la boutique et à l'état de l'abonnement.
