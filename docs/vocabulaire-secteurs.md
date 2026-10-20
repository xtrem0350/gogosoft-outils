# Vocabulaire par secteur — GogoSoft

## Principe

Chaque secteur d'activité possède son propre vocabulaire métier.
Le même moteur technique sert tous les secteurs. Seul l'habillage change.

## Mapping ModuleId ↔ Secteur

| ModuleId | Secteur |
|---|---|
| `reparation-telephone` | Réparation Téléphone |
| `reparation-pc` | Réparation PC |
| `vente-telephone` | Vente Téléphone |
| `vente-pc` | Vente PC |
| `consommables` | Aucun vocabulaire métier dédié |
| `vitrine-telephone` | Vitrine Téléphone |
| `vitrine-pc` | Vitrine PC |
| `multi-ateliers` | Module système — fallback neutre |

## Tableau de référence

| Secteur | Catégorie | Appareil | Lieu | Client | Commande |
|---|---|---|---|---|---|
| Réparation Téléphone | Réparation | Téléphone | Atelier | Client | Fiche de réparation |
| Réparation PC | Réparation | PC | Atelier | Client | Fiche de réparation |
| Vente Téléphone | Vente | Téléphone | Boutique | Acheteur | Vente |
| Vente PC | Vente | PC | Boutique | Acheteur | Vente |
| Vitrine Téléphone | Vitrine | Téléphone | Vitrine en ligne | Visiteur | Commande en ligne |
| Vitrine PC | Vitrine | PC | Vitrine en ligne | Visiteur | Commande en ligne |

## Règles d'usage

- "Client" est CONSERVÉ en réparation.
- En vente, "Client" devient "Acheteur".
- En vitrine, "Client" devient "Visiteur".
- "multi-ateliers" est un module SYSTÈME : pas de vocabulaire propre, fallback neutre.
- Les capacités booléennes pilotent l'UI.

## Multi-secteurs

- `useSectorVocabulary()` → premier module métier actif
- `useSectorVocabularyFor(id)` → vocabulaire précis
- `useAggregatedVocabulary()` → fusion OR des capacités

## Utilisation

```tsx
const v = useSectorVocabulary();
<h1>Nouvelle {v.order.toLowerCase()}</h1>
```

## Vagues suivantes

- Vague 3 : Migration SideBar + Dashboard
- Vague 4 : Workflows réparateur téléphone (focus MVP)
- Vague 5 : Démo Trial cohérente
- Vague 6 : Abonnement simulé clarifié
