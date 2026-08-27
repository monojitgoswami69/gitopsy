/**
 * COMMIT DETAIL SAMPLING STRATEGY
 *
 * Diff details (additions/deletions/filesChanged) cost exactly one API call
 * per commit — GitHub has no bulk endpoint for per-commit line stats. To keep
 * full runs inside the rate budget while making the "insider" size metrics
 * (median commit size, size distribution, largest commit) representative:
 *
 * - Repos at or below FULL_DETAIL_CAP commits: fetch details for EVERY commit
 *   (exact metrics, bounded cost).
 * - Larger repos: fetch a stratified sample spread evenly across the entire
 *   history (newest AND oldest included), so every era of the repo is
 *   represented instead of only the recency slice.
 *
 * Overview/summary metrics are deliberately unaffected by this choice: commit
 * counts come from the uncapped listing and churn totals from the
 * authoritative contributor-stats endpoint.
 */

/** Repos up to this many commits get full per-commit detail coverage. */
export const FULL_DETAIL_CAP = 200;

/** Stratified sample size for repos exceeding FULL_DETAIL_CAP. */
export const STRATIFIED_SAMPLE_SIZE = 40;

export function selectDetailIndices(
  totalCommits: number,
  fullDetailCap: number = FULL_DETAIL_CAP,
  stratifiedSampleSize: number = STRATIFIED_SAMPLE_SIZE
): number[] {
  if (!Number.isFinite(totalCommits) || totalCommits <= 0) {
    return [];
  }

  if (totalCommits <= fullDetailCap) {
    return Array.from({ length: totalCommits }, (_, i) => i);
  }

  // Degenerate sample sizes (0 or 1) must not reach the stride math below,
  // where (size - 1) divides and would produce NaN/empty indices.
  if (stratifiedSampleSize <= 0) return [];
  if (stratifiedSampleSize === 1) return [0];

  // Evenly spaced across [0, totalCommits - 1], inclusive of both ends.
  const indices: number[] = [];
  for (let i = 0; i < stratifiedSampleSize; i++) {
    indices.push(Math.round((i * (totalCommits - 1)) / (stratifiedSampleSize - 1)));
  }
  return indices;
}
