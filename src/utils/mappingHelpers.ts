import type { RequiredColumnDisplay } from "../data/evaluationData";
import type { MappingRow } from "../types/mapping.types";

/**
 * Get a human-readable status label for a required column role based on how many columns map to it.
 */
export function getRoleStatusLabel(role: RequiredColumnDisplay, matchedCount: number) {
  if (matchedCount === 0) {
    return { label: "Missing", tone: "destructive" as const };
  }
  if (role.code === "prob_class_*" || role.code === "prob_label_*") {
    return { label: `${matchedCount} mapped`, tone: "secondary" as const };
  }
  if (matchedCount > 1) {
    return { label: "Conflict", tone: "destructive" as const };
  }
  return { label: "Mapped", tone: "secondary" as const };
}

/**
 * Determine the visual match state for a single mapping row.
 */
export function getRowMatchState(row: MappingRow, duplicate: boolean) {
  if (duplicate) {
    return { label: "Conflict", tone: "destructive" as const };
  }
  if (row.confirmedRole === null) {
    return { label: "Unmapped", tone: "destructive" as const };
  }
  if (row.modified) {
    return { label: "Changed", tone: "secondary" as const };
  }
  if (row.warnings.length > 0) {
    return { label: "Needs Review", tone: "outline" as const };
  }
  return { label: "Matched", tone: "secondary" as const };
}
