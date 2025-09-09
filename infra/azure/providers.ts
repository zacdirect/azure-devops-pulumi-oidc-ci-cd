import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";
import { execSync } from "child_process";
import { ProjectConfig } from "../project-config";
import { ExtendedAzureProvider } from "./provider";

export interface ProvidersResult {
    environments: Record<string, ExtendedAzureProvider>;
}

/**
 * Get current Azure context from environment variables and Azure CLI
 * without requiring a provider. This provides fallback values for provider creation.
 */
function getCurrentAzureContext(): { subscriptionId?: string; tenantId?: string; clientId?: string } {
    // Check environment variables first (commonly used in CI/CD)
    const envSubscriptionId = process.env.ARM_SUBSCRIPTION_ID || process.env.AZURE_SUBSCRIPTION_ID;
    const envTenantId = process.env.ARM_TENANT_ID || process.env.AZURE_TENANT_ID;
    const envClientId = process.env.ARM_CLIENT_ID || process.env.AZURE_CLIENT_ID;
    
    // Try Azure CLI as fallback if environment variables are not set
    let cliSubscriptionId: string | undefined;
    let cliTenantId: string | undefined;
    
    try {
        if (!envSubscriptionId) {
            cliSubscriptionId = execSync('az account show --query id -o tsv', { encoding: 'utf8' }).trim();
        }
        if (!envTenantId) {
            cliTenantId = execSync('az account show --query tenantId -o tsv', { encoding: 'utf8' }).trim();
        }
    } catch (error) {
        // Azure CLI not available or not logged in - that's fine, we'll rely on explicit config
        pulumi.log.warn('Azure CLI not available for fallback context. Ensure provider configuration is complete.');
    }
    
    const context = {
        subscriptionId: envSubscriptionId || cliSubscriptionId,
        tenantId: envTenantId || cliTenantId,
        clientId: envClientId, // CLI doesn't provide clientId for service principals
    };
    
    pulumi.log.debug(`Azure context detected: subscriptionId=${context.subscriptionId ? '[FOUND]' : '[MISSING]'}, tenantId=${context.tenantId ? '[FOUND]' : '[MISSING]'}, clientId=${context.clientId ? '[FOUND]' : '[MISSING]'}`);
    
    return context;
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
    pulumi.log.debug("Creating providers for environments...");
    const environmentProviders: Record<string, ExtendedAzureProvider> = {};

    // Get current Azure context for runtime resolution from environment/CLI
    const currentContext = getCurrentAzureContext();

    // Create environment-specific providers based on configuration
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        pulumi.log.debug(`Creating provider for environment: ${envKey}`);
        
        // Provider name matches environment name (1:1 relationship)
        const providerName = envKey;
        
        // Resolve provider configuration with current Azure context
        const resolvedConfig = config.resolveProvider(providerName);
        
        // Determine authentication method:
        // - If we're in Azure DevOps CI/CD (has OIDC token), use OIDC authentication
        // - If we're in local development (has Azure CLI context), use CLI authentication
        // - If we have explicit client credentials, use service principal authentication
        const hasOidcToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || process.env.SYSTEM_OIDCTOKEN;
        const hasClientCredentials = resolvedConfig.clientId && resolvedConfig.clientSecret;
        const hasAzureCli = currentContext.subscriptionId && currentContext.tenantId;
        
        let authConfig: {
            subscriptionId: string;
            tenantId: string;
            clientId?: string;
            clientSecret?: string;
            useOidc?: boolean;
            subscriptionName: string;
        };
        
        if (hasOidcToken && resolvedConfig.useOidc && resolvedConfig.clientId) {
            // CI/CD with OIDC authentication (Azure DevOps -> Azure)
            pulumi.log.debug(`Using OIDC authentication for environment '${envKey}'`);
            authConfig = {
                subscriptionId: resolvedConfig.subscriptionId || currentContext.subscriptionId || "",
                tenantId: resolvedConfig.tenantId || currentContext.tenantId || "",
                clientId: resolvedConfig.clientId,
                useOidc: true,
                subscriptionName: resolvedConfig.subscriptionName || (currentContext.subscriptionId ? `subscription-${currentContext.subscriptionId}` : ""),
            };
        } else if (hasClientCredentials) {
            // Service principal authentication with client secret
            pulumi.log.debug(`Using service principal authentication for environment '${envKey}'`);
            authConfig = {
                subscriptionId: resolvedConfig.subscriptionId || currentContext.subscriptionId || "",
                tenantId: resolvedConfig.tenantId || currentContext.tenantId || "",
                clientId: resolvedConfig.clientId,
                clientSecret: resolvedConfig.clientSecret,
                subscriptionName: resolvedConfig.subscriptionName || (currentContext.subscriptionId ? `subscription-${currentContext.subscriptionId}` : ""),
            };
        } else if (hasAzureCli) {
            // Local development with Azure CLI authentication
            pulumi.log.debug(`Using Azure CLI authentication for environment '${envKey}'`);
            authConfig = {
                subscriptionId: resolvedConfig.subscriptionId || currentContext.subscriptionId || "",
                tenantId: resolvedConfig.tenantId || currentContext.tenantId || "",
                subscriptionName: resolvedConfig.subscriptionName || (currentContext.subscriptionId ? `subscription-${currentContext.subscriptionId}` : ""),
                // No clientId, clientSecret, or useOidc - will use Azure CLI
            };
        } else {
            throw new Error(`No valid authentication method found for environment '${envKey}'. Either configure OIDC (clientId + useOidc), service principal (clientId + clientSecret), or ensure Azure CLI is logged in.`);
        }
        
        environmentProviders[envKey] = new ExtendedAzureProvider(`azure-${envKey}`, authConfig);
        pulumi.log.debug(`Provider created for environment: ${envKey}`);
    });

    pulumi.log.debug(`Total providers created: ${Object.keys(environmentProviders).length}`);
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
