import { describe, it, expect } from "vitest";
import { selectDetailIndices, FULL_DETAIL_CAP, STRATIFIED_SAMPLE_SIZE } from "@/lib/github/detailSampling";

describe("Commit Detail Sampling", () => {
  it("returns no indices for empty repos", () => {
    expect(selectDetailIndices(0)).toEqual([]);
  });

  it("covers every commit for repos at or below the cap", () => {
    const indices = selectDetailIndices(200);
    expect(indices).toHaveLength(200);
    expect(indices[0]).toBe(0);
    expect(indices[199]).toBe(199);
    expect(new Set(indices).size).toBe(200);
  });

  it("produces a bounded stratified sample for large repos", () => {
    const indices = selectDetailIndices(1000);
    expect(indices).toHaveLength(STRATIFIED_SAMPLE_SIZE);
    // Includes both the newest (listing is newest-first) and the oldest
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(999);
    expect(new Set(indices).size).toBe(STRATIFIED_SAMPLE_SIZE);
  });

  it("spreads the sample evenly across the whole history", () => {
    const indices = selectDetailIndices(1000);
    // Consecutive sampled commits should be roughly one full stride apart
    const stride = Math.round(999 / (STRATIFIED_SAMPLE_SIZE - 1));
    for (let i = 1; i < indices.length; i++) {
      const gap = indices[i] - indices[i - 1];
      expect(Math.abs(gap - stride)).toBeLessThanOrEqual(1);
    }
  });

  it("caps and sample size are configurable", () => {
    // 50 commits with cap 100 -> full coverage
    expect(selectDetailIndices(50, 100)).toHaveLength(50);
    // 50 commits with cap 10 -> over cap, stratified to requested size
    expect(selectDetailIndices(50, 10, 10)).toHaveLength(10);
    const exact = selectDetailIndices(1000, 200, 5);
    expect(exact).toHaveLength(5);
    expect(exact[0]).toBe(0);
    expect(exact[4]).toBe(999);
  });

  it("defaults match the documented policy", () => {
    expect(FULL_DETAIL_CAP).toBe(200);
    expect(STRATIFIED_SAMPLE_SIZE).toBe(40);
  });
});
