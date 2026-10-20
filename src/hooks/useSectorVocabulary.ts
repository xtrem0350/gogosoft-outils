import { useMemo } from "react";

import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { NEUTRAL_VOCABULARY, SECTORS } from "@/constants/sectors";
import type { ModuleId } from "@/types/modules";
import type { SectorModuleId, SectorVocabulary } from "@/types/sectors";

/**
 * Indique si un module possède un vocabulaire métier propre.
 * "multi-ateliers" et "consommables" (stock) n'en ont pas : ils retombent sur le vocabulaire neutre.
 * @param id Identifiant du module actif.
 * @returns true si le module est un secteur présent dans SECTORS.
 */
function isSectorModuleId(id: ModuleId): id is SectorModuleId {
  if (id === "multi-ateliers" || id === "consommables") return false;
  return SECTORS[id] !== undefined;
}

/**
 * Vocabulaire du premier secteur actif, ou vocabulaire neutre si aucun secteur métier n'est actif.
 * @returns Vocabulaire du secteur.
 */
export function useSectorVocabulary(): SectorVocabulary {
  const { activeModules } = useActiveModules();
  return useMemo(() => {
    const firstSector = activeModules.find(isSectorModuleId);
    if (!firstSector) return NEUTRAL_VOCABULARY;
    return SECTORS[firstSector] ?? NEUTRAL_VOCABULARY;
  }, [activeModules]);
}

/**
 * Vocabulaire d'un secteur donné, avec repli sur le vocabulaire neutre.
 * @param moduleId Secteur ciblé.
 * @returns Vocabulaire du secteur.
 */
export function useSectorVocabularyFor(moduleId: SectorModuleId): SectorVocabulary {
  return useMemo(() => SECTORS[moduleId] ?? NEUTRAL_VOCABULARY, [moduleId]);
}

/**
 * Vocabulaire combiné de tous les secteurs actifs (capacités cumulées, modes de paiement fusionnés).
 * @returns Vocabulaire agrégé, ou neutre si aucun secteur métier n'est actif.
 */
export function useAggregatedVocabulary(): SectorVocabulary {
  const { activeModules } = useActiveModules();
  return useMemo(() => {
    const sectorIds = activeModules.filter(isSectorModuleId);
    if (sectorIds.length === 0) return NEUTRAL_VOCABULARY;
    if (sectorIds.length === 1) {
      const onlySectorId = sectorIds[0];
      return onlySectorId ? SECTORS[onlySectorId] ?? NEUTRAL_VOCABULARY : NEUTRAL_VOCABULARY;
    }

    const vocabularies = sectorIds
      .map((id) => SECTORS[id])
      .filter((vocabulary): vocabulary is SectorVocabulary => Boolean(vocabulary));
    const firstVocabulary = vocabularies[0];
    if (!firstVocabulary) return NEUTRAL_VOCABULARY;
    const base = { ...firstVocabulary };

    for (const vocabulary of vocabularies.slice(1)) {
      base.hasCart = base.hasCart || vocabulary.hasCart;
      base.hasDelivery = base.hasDelivery || vocabulary.hasDelivery;
      base.hasDiagnostic = base.hasDiagnostic || vocabulary.hasDiagnostic;
      base.hasWarranty = base.hasWarranty || vocabulary.hasWarranty;
      base.hasInPersonSale = base.hasInPersonSale || vocabulary.hasInPersonSale;
      base.hasOnlineSale = base.hasOnlineSale || vocabulary.hasOnlineSale;
      base.paymentModes = Array.from(new Set([...base.paymentModes, ...vocabulary.paymentModes]));
    }
    return base;
  }, [activeModules]);
}
