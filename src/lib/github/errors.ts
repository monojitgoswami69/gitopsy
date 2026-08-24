export class ForensicGitHubError extends Error {
  public statusCode?: number;
  public retryAfterSeconds?: number;
  public isSecondaryRateLimit?: boolean;
  public isResumable?: boolean;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      retryAfterSeconds?: number;
      isSecondaryRateLimit?: boolean;
      isResumable?: boolean;
    }
  ) {
    super(message);
    this.name = "ForensicGitHubError";
    this.statusCode = options?.statusCode;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.isSecondaryRateLimit = options?.isSecondaryRateLimit;
    this.isResumable = options?.isResumable;
  }
}

export class ForensicRateLimitError extends ForensicGitHubError {
  public resetTimeIso: string;

  constructor(
    message: string,
    resetTimeIso: string,
    retryAfterSeconds: number = 60,
    isSecondary = false,
    isResumable = false
  ) {
    super(message, {
      statusCode: 403,
      retryAfterSeconds,
      isSecondaryRateLimit: isSecondary,
      isResumable,
    });
    this.name = "ForensicRateLimitError";
    this.resetTimeIso = resetTimeIso;
  }
}

export class ForensicAuthError extends ForensicGitHubError {
  constructor(message: string = "GitHub authorization expired or revoked.") {
    super(message, { statusCode: 401 });
    this.name = "ForensicAuthError";
  }
}

export class ForensicPermissionError extends ForensicGitHubError {
  constructor(resource: string) {
    super(`Access denied for specimen resource: ${resource}`, { statusCode: 403 });
    this.name = "ForensicPermissionError";
  }
}

export function isResumableRateLimitError(err: unknown): boolean {
  if (err instanceof ForensicRateLimitError) {
    return err.isResumable === true;
  }
  const obj = err as { isResumable?: boolean; name?: string };
  return obj?.isResumable === true || obj?.name === "ForensicRateLimitError";
}
