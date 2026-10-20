import { useMemo } from "react";

import { useActiveModules } from "@/contexts/ActiveModulesContext";
import { NEUTRAL_VOCABULARY, SECTORS } from "@/constants/sectors";
import type { SectorModuleId, SectorVocabulary } from "@/types/sectors";

export function useSectorVocabulary(): SectorVocabulary {
  const { activeModules } = useActiveModules();
  return useMemo(() => {
    const firstSector = activeModules.find(
      (id): id is SectorModuleId => id !== "multi-ateliers" && SECTORS[id] !== undefined,
    );
    if (!firstSector) return NEUTRAL_VOCABULARY;
    return SECTORS[firstSector] ?? NEUTRAL_VOCABULARY;
  }, [activeModules]);
}

export function useSectorVocabularyFor(moduleId: SectorModuleId): SectorVocabulary {
  return useMemo(() => SECTORS[moduleId] ?? NEUTRAL_VOCABULARY, [moduleId]);
}

export function useAggregatedVocabulary(): SectorVocabulary {
  const { activeModules } = useActiveModules();
  return useMemo(() => {
    const sectorIds = activeModules.filter(
      (id): id is SectorModuleId => id !== "multi-ateliers" && SECTORS[id] !== undefined,
    );
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
