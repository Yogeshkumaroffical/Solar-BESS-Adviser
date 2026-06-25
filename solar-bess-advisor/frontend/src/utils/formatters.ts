/**
 * Formatting utilities for India energy market metrics.
 */

export function formatCrores(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `₹${value.toFixed(2)} Cr`;
}

export function formatTariff(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `₹${value.toFixed(2)}/kWh`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(2)}%`;
}
