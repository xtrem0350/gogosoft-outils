# Workflow du nom de domaine

## Choix du domaine

Le client choisit un nom en `.com` lors de la souscription mensuelle ou annuelle. Le nom demandé est enregistré sur l'abonnement dans `domain_requested` et son état débute à `pending` une fois le domaine commandé. Le forfait annuel inclut un nom de domaine `.com` ; l'option du forfait mensuel est facturée 10 000 FCFA par an.

Le coût fournisseur estimé est d'environ 6 000 FCFA par an. Le montant facturé couvre donc l'enregistrement et le suivi du domaine. La disponibilité doit être confirmée avant tout achat.

## Achat et activation

Après confirmation de disponibilité et de paiement, le domaine est acheté auprès du registrar. La date d'achat est inscrite dans `domain_purchased_at`, puis `domain_status` passe à `active`. Le client est informé lorsque le domaine et sa configuration sont prêts.

## Transfert interne

Pour transférer un domaine entre comptes GogoSoft, l'équipe effectue un « push » interne depuis le registrar vers le compte destinataire. Le transfert ne nécessite pas de code de transfert public (EPP) tant qu'il reste chez le même registrar. Après vérification du compte cible, `domain_requested` est mis à jour et l'état reste `transferred` jusqu'à confirmation de réception, puis repasse à `active`.

## Statuts

- `none` : aucun domaine associé.
- `pending` : domaine demandé, achat ou configuration en cours.
- `active` : domaine activé pour le compte.
- `transferred` : push interne initié ou effectué vers un autre compte.

Un renouvellement est requis chaque année après la période incluse ou payée. Le renouvellement et la confirmation de disponibilité restent des opérations manuelles tant qu'une intégration registrar n'est pas configurée.
