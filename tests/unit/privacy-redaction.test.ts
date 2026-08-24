import { describe, it, expect } from "vitest";
import { ForensicDataSanitizer } from "@/lib/db/exportImport";

describe("Forensic Privacy Redaction Engine", () => {
  it("should completely strip tokens, authorization headers, and secrets from export structures", () => {
    const dirtyData = {
      profile: { login: "testuser" },
      token: "ghp_superSecretToken12345",
      access_token: "gho_anotherSecretToken",
      code_verifier: "pkce_verifier_secret_12345",
      authorization: "Bearer secret",
      oauth_state: "state_123",
      safeData: {
        commits: 120,
        repositories: ["repo1", "repo2"],
      },
    };

    const sanitized = ForensicDataSanitizer.sanitizeExportData(dirtyData);
    const jsonString = JSON.stringify(sanitized);

    expect(jsonString).not.toContain("ghp_superSecretToken12345");
    expect(jsonString).not.toContain("gho_anotherSecretToken");
    expect(jsonString).not.toContain("pkce_verifier_secret_12345");
    expect(jsonString).not.toContain("Bearer secret");
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.safeData.commits).toBe(120);
  });
});
