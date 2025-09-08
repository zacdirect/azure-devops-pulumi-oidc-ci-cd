import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ExtendedAzureProvider } from "./provider";
import { getConfigValue } from "../layered-config";

export interface ProvidersResult {
    environments: Record<string, ExtendedAzureProvider>;
}

/**
 * Create Azure providers for each environment based on configuration.
 * All Azure resources must be associated with a specific environment.
 * No default or management providers are used.
 */
export function createProviders(config: ProjectConfig): ProvidersResult {
    const environmentProviders: Record<string, ExtendedAzureProvider> = {};

    // Create environment-specific providers based on configuration
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        const providerName = envConfig.provider || envKey; // Default to environment name as provider name
        
        if (!config.providers[providerName]) {
            throw new Error(`Provider '${providerName}' referenced by environment '${envKey}' not found in configuration. All environments must have explicit provider configuration.`);
        }

        const providerConfig = config.providers[providerName];
        
        environmentProviders[envKey] = new ExtendedAzureProvider(`azure-${envKey}`, {
            subscriptionId: providerConfig.subscriptionId,
            tenantId: providerConfig.tenantId,
            clientId: providerConfig.clientId,
            clientSecret: providerConfig.clientSecret,
            useOidc: providerConfig.useOidc,
            subscriptionName: providerConfig.subscriptionName || `${envKey} Subscription`,
        });
    });

    return {
        environments: environmentProviders,
    };
}

/**
 * Helper function to get the provider for a specific environment
 */
export function getProviderForEnvironment(
    providers: ProvidersResult, 
    environmentName: string
): ExtendedAzureProvider {
    const provider = providers.environments[environmentName];
    if (!provider) {
        throw new Error(`No provider found for environment '${environmentName}'. All environments must have explicit provider configuration.`);
    }
    return provider;
}
