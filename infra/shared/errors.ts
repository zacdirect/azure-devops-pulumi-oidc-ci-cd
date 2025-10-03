/**
 * Custom error classes for better error handling and debugging.
 * These errors provide context-specific information to help troubleshoot issues.
 */

/**
 * Error thrown when a provider cannot be found for an environment.
 */
export class ProviderNotFoundError extends Error {
    constructor(environmentName: string) {
        super(
            `No provider found for environment '${environmentName}'. ` +
            `All environments must have explicit provider configuration.`
        );
        this.name = 'ProviderNotFoundError';
    }
}

/**
 * Error thrown when resource groups cannot be found for an environment.
 */
export class ResourceGroupNotFoundError extends Error {
    constructor(environmentName: string) {
        super(`Resource groups not found for environment '${environmentName}'`);
        this.name = 'ResourceGroupNotFoundError';
    }
}

/**
 * Error thrown when configuration validation fails.
 */
export class ConfigurationValidationError extends Error {
    constructor(message: string, errors: string[]) {
        const errorList = errors.map(e => `  - ${e}`).join('\n');
        super(`${message}:\n${errorList}`);
        this.name = 'ConfigurationValidationError';
    }
}

/**
 * Error thrown when Azure authentication configuration is invalid.
 */
export class AuthenticationConfigurationError extends Error {
    constructor(environmentName: string, message: string) {
        super(`Authentication configuration error for environment '${environmentName}': ${message}`);
        this.name = 'AuthenticationConfigurationError';
    }
}

/**
 * Error thrown when a required configuration value is missing.
 */
export class MissingConfigurationError extends Error {
    constructor(configKey: string, context?: string) {
        const contextMsg = context ? ` (${context})` : '';
        super(`Missing required configuration: '${configKey}'${contextMsg}`);
        this.name = 'MissingConfigurationError';
    }
}
