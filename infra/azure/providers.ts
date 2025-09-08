import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";
import { ProjectConfig } from "../project-config";
import { ExtendedAzureProvider } from "./provider";

export interface ProvidersResult {
    environments: Record<string, ExtendedAzureProvider>;
}

/**
 * Create Azure providers for each environment based on configuration.
 * All Azure resources must be associated with a specific environment.
 * No default or management providers are used.
 * 
 * This function resolves provider configurations with current Azure context
 * to support partial configuration from ESC/Pulumi config.
 */
export function createProviders(config: ProjectConfig): ProvidersResult {
    const environmentProviders: Record<string, ExtendedAzureProvider> = {};

    // Get current Azure context for runtime resolution as Pulumi Output
    const currentConfig = pulumi.output(azure_native.authorization.getClientConfig());

    // Create environment-specific providers based on configuration
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        // Provider name matches environment name (1:1 relationship)
        const providerName = envKey;
        
        // Resolve provider configuration with current Azure context
        const resolvedConfig = config.resolveProvider(providerName);
        
        // Use Pulumi outputs to resolve runtime values using current Azure context
        // Pulumi providers accept Input<T> types which can be raw values or Output<T>
        const finalConfig = {
            subscriptionId: resolvedConfig.subscriptionId || currentConfig.subscriptionId,
            tenantId: resolvedConfig.tenantId || currentConfig.tenantId,
            clientId: resolvedConfig.clientId || currentConfig.clientId,
            clientSecret: resolvedConfig.clientSecret, // Keep as-is, may be undefined
            useOidc: resolvedConfig.useOidc,
            subscriptionName: resolvedConfig.subscriptionName || pulumi.interpolate`subscription-${currentConfig.subscriptionId}`,
        };
        
        environmentProviders[envKey] = new ExtendedAzureProvider(`azure-${envKey}`, finalConfig);
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
