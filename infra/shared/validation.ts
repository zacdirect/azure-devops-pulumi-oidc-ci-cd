import * as pulumi from '@pulumi/pulumi';
import { ProviderConfig } from '../project-config';
import { ConfigurationValidationError, AuthenticationConfigurationError } from './errors';

/**
 * Utility class for validating configuration values.
 * Helps catch configuration errors early with clear, actionable error messages.
 */
export class ConfigurationValidator {
    /**
     * Validate Azure provider configuration for an environment.
     * Ensures all required fields are present based on authentication method.
     * 
     * @param config - Provider configuration to validate
     * @param environmentName - Name of the environment being validated
     * @throws {ConfigurationValidationError} if validation fails
     */
    static validateAzureProvider(config: ProviderConfig, environmentName: string): void {
        const errors: string[] = [];

        // Basic required fields
        if (!config.subscriptionId?.trim()) {
            errors.push(`subscriptionId is required for environment '${environmentName}'`);
        }

        if (!config.tenantId?.trim()) {
            errors.push(`tenantId is required for environment '${environmentName}'`);
        }

        // OIDC-specific validation
        if (config.useOidc) {
            if (!config.clientId?.trim()) {
                errors.push(
                    `clientId is required when useOidc is true for environment '${environmentName}'. ` +
                    `This is needed for federated identity authentication.`
                );
            }
            
            if (config.clientSecret?.trim()) {
                pulumi.log.warn(
                    `Environment '${environmentName}': clientSecret is set but useOidc is true. ` +
                    `OIDC authentication will be used and clientSecret will be ignored.`
                );
            }
        }

        // Service Principal validation
        if (!config.useOidc && config.clientId?.trim()) {
            if (!config.clientSecret?.trim()) {
                errors.push(
                    `clientSecret is required when clientId is provided and useOidc is false ` +
                    `for environment '${environmentName}'. This is needed for service principal authentication.`
                );
            }
        }

        if (errors.length > 0) {
            throw new ConfigurationValidationError(
                `Provider configuration validation failed for environment '${environmentName}'`,
                errors
            );
        }

        pulumi.log.debug(
            `Provider configuration validated successfully for environment '${environmentName}' ` +
            `(auth method: ${config.useOidc ? 'OIDC' : config.clientId ? 'Service Principal' : 'Azure CLI'})`
        );
    }

    /**
     * Validate that required configuration values are present.
     * 
     * @param values - Object with configuration values to validate
     * @param context - Context for error messages (e.g., "Azure provider for dev")
     * @throws {ConfigurationValidationError} if any required values are missing
     */
    static validateRequiredFields(
        values: Record<string, string | undefined>,
        context: string
    ): void {
        const errors: string[] = [];

        for (const [key, value] of Object.entries(values)) {
            if (!value?.trim()) {
                errors.push(`${key} is required`);
            }
        }

        if (errors.length > 0) {
            throw new ConfigurationValidationError(
                `Missing required configuration for ${context}`,
                errors
            );
        }
    }

    /**
     * Validate authentication configuration and provide guidance on available methods.
     * 
     * @param config - Provider configuration
     * @param environmentName - Environment name
     * @returns Authentication method that will be used
     */
    static determineAuthMethod(config: ProviderConfig, environmentName: string): string {
        // Priority order: OIDC > Service Principal > Azure CLI
        
        if (config.useOidc && config.clientId?.trim()) {
            return 'OIDC';
        }

        if (config.clientId?.trim() && config.clientSecret?.trim()) {
            return 'Service Principal';
        }

        if (!config.clientId && !config.clientSecret) {
            pulumi.log.info(
                `Environment '${environmentName}': No explicit credentials provided. ` +
                `Will attempt to use Azure CLI authentication.`
            );
            return 'Azure CLI';
        }

        throw new AuthenticationConfigurationError(
            environmentName,
            'Invalid authentication configuration. Please provide either: ' +
            '(1) clientId for OIDC, (2) clientId + clientSecret for Service Principal, ' +
            'or (3) no credentials to use Azure CLI'
        );
    }

    /**
     * Validate environment configuration.
     * 
     * @param envName - Environment name
     * @param envConfig - Environment configuration
     * @throws {ConfigurationValidationError} if validation fails
     */
    static validateEnvironment(envName: string, envConfig: any): void {
        const errors: string[] = [];

        if (typeof envConfig.displayOrder !== 'number') {
            errors.push('displayOrder must be a number');
        }

        if (!envConfig.displayName?.trim()) {
            errors.push('displayName is required');
        }

        if (envConfig.dependentEnvironment && typeof envConfig.dependentEnvironment !== 'string') {
            errors.push('dependentEnvironment must be a string');
        }

        if (errors.length > 0) {
            throw new ConfigurationValidationError(
                `Environment configuration validation failed for '${envName}'`,
                errors
            );
        }
    }
}
