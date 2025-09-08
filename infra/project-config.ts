import * as pulumi from "@pulumi/pulumi";
import { getConfigValue } from "./layered-config";


export interface SubnetsAndSizes {
    agents: number;
    private_endpoints: number;
}

export interface ResourceNameTemplates {
    resourceGroupStateName: string;
    resourceGroupAgentsName: string;
    resourceGroupIdentityName: string;
    virtualNetworkName: string;
    networkSecurityGroupName: string;
    natGatewayName: string;
    natGatewayPublicIpName: string;
    storageAccountName: string;
    storageAccountPrivateEndpointName: string;
    agentComputePostfixName: string;
    containerInstancePrefixName: string;
    containerRegistryName: string;
    projectName: string;
    repositoryMainName: string;
    repositoryTemplateName: string;
    agentPoolName: string;
    groupName: string;
}

/**
 * Provider configuration interface for Azure providers.
 * All fields are optional - missing values will be filled from current Azure context.
 * This supports partial configuration from ESC/Pulumi config with automatic defaults.
 */
export interface ProviderConfig {
    subscriptionId?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    subscriptionName?: string;
    useOidc?: boolean;
}

export interface EnvironmentConfig {
    displayOrder: number;
    displayName: string;
    hasApproval?: boolean;
    dependentEnvironment?: string;
    resourceGroupCreate?: boolean;
    // Provider name always matches environment name (1:1 relationship)
}

/**
 * Simple environment configuration loaded from Pulumi.yaml.
 * Supports the standard dev/test/prod setup from the original Terraform project.
 */
export type Environments = Record<string, EnvironmentConfig>;

/**
 * Provider configurations loaded from Pulumi.yaml.
 * Each provider can be referenced by environments.
 */
export type Providers = Record<string, ProviderConfig>;



export interface ProjectConfigInit {
    versionControlSystemType?: string;
    versionControlSystemOrganization?: string;
    versionControlSystemPoolName?: string;
    location?: string;
    organizationName?: string;
    personalAccessToken?: string;
    azureDevopsProject?: string;
    azureDevopsCreateProject?: boolean;
    useSelfHostedAgents?: boolean;
    selfHostedAgentType?: string;
    addressSpace?: string;
    subnetsAndSizes?: SubnetsAndSizes;
    approvers?: Record<string, string>;
    exampleModulePath?: string;
    repositoryPostfix?: string;
    repositoryPostfixTemplate?: string;
    agentUseAvailabilityZones?: boolean;
    resourceNameLocationShort?: string;
    resourceNameWorkload?: string;
    resourceNameEnvironment?: string;
    resourceNameSequenceStart?: number;
    organizationNamePrefix?: string;
    versionControlSystemAuthenticationMethod?: string;
    versionControlSystemGithubApplicationId?: string;
    versionControlSystemGithubApplicationInstallationId?: string;
    versionControlSystemGithubApplicationKey?: string;
}

export class ProjectConfig extends pulumi.Config {
    public readonly versionControlSystemType: string;
    public readonly versionControlSystemOrganization: string;
    public readonly location: string;
    public readonly organizationName: string;
    public readonly personalAccessToken: string;
    public readonly azureDevopsProject: string;
    public readonly azureDevopsCreateProject: boolean;
    public readonly useSelfHostedAgents: boolean;
    public readonly selfHostedAgentType: string;
    public readonly addressSpace: string;
    public readonly subnetsAndSizes: SubnetsAndSizes;
    public readonly approvers: Record<string, string>;
    public readonly exampleModulePath: string;
    public readonly repositoryPostfix: string;
    public readonly repositoryPostfixTemplate: string;
    public readonly agentUseAvailabilityZones: boolean;
    public readonly resourceNameLocationShort: string;
    public readonly resourceNameWorkload: string;
    public readonly resourceNameEnvironment: string;
    public readonly resourceNameSequenceStart: number;
    public readonly resourceGroupStateName: string;
    public readonly resourceGroupAgentsName: string;
    public readonly resourceGroupIdentityName: string;
    public readonly virtualNetworkName: string;
    public readonly networkSecurityGroupName: string;
    public readonly natGatewayName: string;
    public readonly natGatewayPublicIpName: string;
    public readonly storageAccountName: string;
    public readonly storageAccountPrivateEndpointName: string;
    public readonly agentComputePostfixName: string;
    public readonly containerInstancePrefixName: string;
    public readonly containerRegistryName: string;
    public readonly projectName: string;
    public readonly repositoryMainName: string;
    public readonly repositoryTemplateName: string;
    public readonly agentPoolName: string;
    public readonly groupName: string;
    public readonly environments: Environments;
    public readonly providers: Providers;
    public readonly organizationNamePrefix: string;
    public readonly versionControlSystemAuthenticationMethod: string;
    public readonly versionControlSystemGithubApplicationId: string;
    public readonly versionControlSystemGithubApplicationInstallationId: string;
    public readonly versionControlSystemGithubApplicationKey: string;

    constructor(init?: ProjectConfigInit) {
        super('azure-devops-pulumi-oidc-ci-cd');
        // Helper for layered config
        const layered = <T>(key: string, def: T): T => getConfigValue<T>(this, key, init as Record<string, unknown>, def);

        this.organizationName = layered('organizationName', 'zacharycook/');
        this.versionControlSystemType = layered('versionControlSystemType', 'azuredevops');
        this.versionControlSystemOrganization = layered('versionControlSystemOrganization', `https://dev.azure.com/${this.organizationName}`);
        this.location = layered('location', 'northcentralus');
        this.personalAccessToken = layered('personalAccessToken', process.env['AZDO_PERSONAL_ACCESS_TOKEN'] || '');
        this.azureDevopsProject = layered('azureDevopsProject', 'ZacDirect');
        this.azureDevopsCreateProject = layered('azureDevopsCreateProject', false);
        this.useSelfHostedAgents = layered('useSelfHostedAgents', true);
        this.selfHostedAgentType = layered('selfHostedAgentType', 'azure_container_instance');
        this.addressSpace = layered('addressSpace', '10.0.10.0/24');
        this.subnetsAndSizes = layered('subnetsAndSizes', { agents: 27, private_endpoints: 29 });
        this.approvers = layered('approvers', {});
        this.exampleModulePath = layered('exampleModulePath', '../zac-direct-modules');
        this.repositoryPostfix = layered('repositoryPostfix', 'zacdirect');
        this.repositoryPostfixTemplate = layered('repositoryPostfixTemplate', 'zac-direct-template');
        this.agentUseAvailabilityZones = layered('agentUseAvailabilityZones', false);
        this.resourceNameLocationShort = layered('resourceNameLocationShort', '');
        this.resourceNameWorkload = layered('resourceNameWorkload', 'dema');
        this.resourceNameEnvironment = layered('resourceNameEnvironment', 'mgt');
        this.resourceNameSequenceStart = layered('resourceNameSequenceStart', 1);

        // Compute all template properties at construction
        const replacements = {
            workload: this.resourceNameWorkload,
            environment: this.resourceNameEnvironment,
            location: this.location,
            locationShort: this.resourceNameLocationShort,
            sequence: String(this.resourceNameSequenceStart).padStart(3, '0'),
        };
        this.resourceGroupStateName = layered('resourceGroupStateName', `rg-${replacements.workload}-state-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.resourceGroupAgentsName = layered('resourceGroupAgentsName', `rg-${replacements.workload}-agents-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.resourceGroupIdentityName = layered('resourceGroupIdentityName', `rg-${replacements.workload}-identity-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.virtualNetworkName = layered('virtualNetworkName', `vnet-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.networkSecurityGroupName = layered('networkSecurityGroupName', `nsg-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.natGatewayName = layered('natGatewayName', `nat-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.natGatewayPublicIpName = layered('natGatewayPublicIpName', `pip-nat-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.storageAccountName = layered('storageAccountName', `sto${replacements.workload}${replacements.environment}${replacements.locationShort}${replacements.sequence}`);
        this.storageAccountPrivateEndpointName = layered('storageAccountPrivateEndpointName', `pe-sto-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.agentComputePostfixName = layered('agentComputePostfixName', `${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.containerInstancePrefixName = layered('containerInstancePrefixName', `aci-${replacements.workload}-${replacements.environment}-${replacements.location}`);
        this.containerRegistryName = layered('containerRegistryName', `acr${replacements.workload}${replacements.environment}${replacements.location}${replacements.sequence}`);
        this.projectName = layered('projectName', `${replacements.workload}-${replacements.environment}`);
        this.repositoryMainName = layered('repositoryMainName', `${replacements.workload}-${replacements.environment}-main`);
        this.repositoryTemplateName = layered('repositoryTemplateName', `${replacements.workload}-${replacements.environment}-template`);
        this.agentPoolName = layered('agentPoolName', `agent-pool-${replacements.workload}-${replacements.environment}`);
        this.groupName = layered('groupName', `group-${replacements.workload}-${replacements.environment}-approvers`);

        // Load environments from Pulumi configuration (defined in Pulumi.yaml)
        this.environments = this.getObject<Environments>('environments') || {
            dev: { displayOrder: 1, displayName: 'Development', resourceGroupCreate: true },
            test: { displayOrder: 2, displayName: 'Test', dependentEnvironment: 'dev', resourceGroupCreate: true },
            prod: { displayOrder: 3, displayName: 'Production', hasApproval: true, dependentEnvironment: 'test', resourceGroupCreate: true }
        };

        // Load and resolve providers from Pulumi configuration (defined in Pulumi.yaml)
        // This creates a resolved provider config for each environment using layered config
        // ENFORCES 1:1 RELATIONSHIP: Only providers matching environment names are loaded
        const rawProviders = this.getObject<Providers>('providers') || {};
        this.providers = this.resolveProvidersConfig(rawProviders, init);
        
        this.organizationNamePrefix = layered('organizationNamePrefix', 'https://dev.azure.com');
        this.versionControlSystemAuthenticationMethod = layered('versionControlSystemAuthenticationMethod', 'pat');
        this.versionControlSystemGithubApplicationId = layered('versionControlSystemGithubApplicationId', '');
        this.versionControlSystemGithubApplicationInstallationId = layered('versionControlSystemGithubApplicationInstallationId', '');
        this.versionControlSystemGithubApplicationKey = layered('versionControlSystemGithubApplicationKey', '');
    }

    /**
     * Resolve providers configuration using layered config approach.
     * Enforces 1:1 relationship - each environment gets a provider with the same name.
     * This simplifies configuration and ensures predictable provider mapping.
     * 
     * Layered config resolution order:
     * 1. providers.<environmentName>.<property> (environment-specific)
     * 2. providers.<property> (global provider default) 
     * 3. Default values
     * 
     * Example Pulumi.yaml:
     * ```yaml
     * config:
     *   providers:
     *     subscriptionId: "default-sub-id"     # Global default for all environments
     *     useOidc: true
     *   providers.dev.subscriptionId: "dev-specific-sub-id"    # Dev environment override
     *   providers.prod.tenantId: "prod-specific-tenant-id"     # Prod environment override
     * ```
     */
    private resolveProvidersConfig(rawProviders: Providers, init?: ProjectConfigInit): Providers {
        const resolvedProviders: Providers = {};
        
        // Helper for layered config specific to providers
        const layeredProvider = <T>(environmentName: string, key: string, def?: T): T | undefined => {
            // Try environment-specific config first (providers.<envName>.<property>)
            const envSpecificKey = `providers.${environmentName}.${key}`;
            const envValue = getConfigValue<T>(this, envSpecificKey, init as Record<string, unknown>, undefined);
            if (envValue !== undefined) return envValue;
            
            // Try global provider config (providers.<property>)
            const globalKey = `providers.${key}`;
            const globalValue = getConfigValue<T>(this, globalKey, init as Record<string, unknown>, undefined);
            if (globalValue !== undefined) return globalValue;
            
            // Fall back to default
            return def;
        };

        // Create provider config for each environment (1:1 relationship)
        Object.keys(this.environments).forEach(envName => {
            // Get raw provider config as starting point (if it exists)
            const rawProvider = rawProviders[envName] || {};
            
            // Resolve provider config using layered approach
            // Provider name always matches environment name
            resolvedProviders[envName] = {
                subscriptionId: rawProvider.subscriptionId || layeredProvider<string>(envName, 'subscriptionId'),
                tenantId: rawProvider.tenantId || layeredProvider<string>(envName, 'tenantId'),
                clientId: rawProvider.clientId || layeredProvider<string>(envName, 'clientId'),
                clientSecret: rawProvider.clientSecret || layeredProvider<string>(envName, 'clientSecret'),
                subscriptionName: rawProvider.subscriptionName || layeredProvider<string>(envName, 'subscriptionName'),
                useOidc: rawProvider.useOidc ?? layeredProvider<boolean>(envName, 'useOidc', true),
            };
        });

        return resolvedProviders;
    }

    /**
     * Get environment configuration by name
     */
    public getEnvironment(name: string): EnvironmentConfig | undefined {
        return this.environments[name];
    }

    /**
     * Get all environment names
     */
    public getEnvironmentNames(): string[] {
        return Object.keys(this.environments);
    }

    /**
     * Get environments sorted by display order
     */
    public getEnvironmentsSorted(): Array<{ name: string; config: EnvironmentConfig }> {
        return Object.entries(this.environments)
            .map(([name, config]) => ({ name, config }))
            .sort((a, b) => a.config.displayOrder - b.config.displayOrder);
    }

    /**
     * Check if an environment exists
     */
    public hasEnvironment(name: string): boolean {
        return name in this.environments;
    }

    /**
     * Get the dependent environment for a given environment
     */
    public getDependentEnvironment(environmentName: string): string | undefined {
        const env = this.getEnvironment(environmentName);
        return env?.dependentEnvironment;
    }

    /**
     * Get provider configuration by name
     */
    public getProvider(name: string): ProviderConfig | undefined {
        return this.providers[name];
    }

    /**
     * Get all provider names
     */
    public getProviderNames(): string[] {
        return Object.keys(this.providers);
    }

    /**
     * Resolve a provider configuration by filling missing values from current Azure context.
     * This enables flexible configuration where ESC/Pulumi config can provide any subset of values.
     * Since providers are now pre-resolved in constructor, this mainly handles runtime context.
     */
    public resolveProvider(name: string): ProviderConfig {
        const config = this.getProvider(name) || {};
        
        // Return the config as resolved - empty values will be filled at runtime by providers.ts
        return {
            subscriptionId: config.subscriptionId,
            tenantId: config.tenantId, 
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            subscriptionName: config.subscriptionName,
            useOidc: config.useOidc ?? true,
        };
    }

    /**
     * Resolve provider configuration for an environment.
     * Uses 1:1 relationship - provider name is always the same as environment name.
     */
    public resolveEnvironmentProvider(environmentName: string): ProviderConfig {
        return this.resolveProvider(environmentName);
    }
}
