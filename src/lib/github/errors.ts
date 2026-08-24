export class ForensicGitHubError extends Error {
  public statusCode?: number;
  public retryAfterSeconds?: number;
  public isSecondaryRateLimit?: boolean;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      retryAfterSeconds?: number;
      isSecondaryRateLimit?: boolean;
    }
  ) {
    super(message);
    this.name = "ForensicGitHubError";
    this.statusCode = options?.statusCode;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.isSecondaryRateLimit = options?.isSecondaryRateLimit;
  }
}

export class ForensicRateLimitError extends ForensicGitHubError {
  public resetTimeIso: string;

  constructor(message: string, resetTimeIso: string, retryAfterSeconds: number = 60, isSecondary = false) {
    super(message, {
      statusCode: 403,
      retryAfterSeconds,
      isSecondaryRateLimit: isSecondary,
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
