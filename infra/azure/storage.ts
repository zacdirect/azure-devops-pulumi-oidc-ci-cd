import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { VirtualNetworksResult } from "./virtual-network";
import { ProvidersResult } from "./providers";
import { getStandardTags } from "../shared/common";

// Network rules configuration
export interface NetworkRules {
    defaultAction: "Allow" | "Deny";
    bypass?: string[];
    ipRules?: string[];
    virtualNetworkSubnetIds?: pulumi.Input<string>[];
}

// Container configuration matching Terraform module
export interface ContainerConfig {
    name: string;
    containerAccessType?: "Blob" | "Container" | "None";
    metadata?: Record<string, string>;
    roleAssignments?: Record<string, RoleAssignment>;
}

// Role assignment configuration
export interface RoleAssignment {
    roleDefinitionIdOrName: string;
    principalId: string;
    description?: string;
    skipServicePrincipalAadCheck?: boolean;
    condition?: string;
    conditionVersion?: string;
    delegatedManagedIdentityResourceId?: string;
}

// Private endpoint configuration
export interface PrivateEndpoint {
    name?: string;
    subnetResourceId: string;
    subresourceName: string;
    networkInterfaceName?: string;
    privateServiceConnectionName?: string;
    location?: string;
    resourceGroupName?: string;
    tags?: Record<string, string>;
    roleAssignments?: Record<string, RoleAssignment>;
}

// Managed identity configuration
export interface ManagedIdentities {
    systemAssigned?: boolean;
    userAssignedResourceIds?: string[];
}

// Main storage account arguments
export interface StorageAccountArgs {
    // Required arguments
    location: string;
    name: string;
    resourceGroupName: pulumi.Input<string>;
    
    // Core storage account configuration
    accountTier?: "Standard" | "Premium";
    accountReplicationType?: "LRS" | "GRS" | "ZRS" | "GZRS" | "RAGRS" | "RAGZRS";
    accountKind?: "Storage" | "StorageV2" | "BlobStorage" | "BlockBlobStorage" | "FileStorage";
    
    // Security and access configuration
    minTlsVersion?: "TLS1_0" | "TLS1_1" | "TLS1_2";
    httpsTrafficOnlyEnabled?: boolean;
    publicNetworkAccessEnabled?: boolean;
    sharedAccessKeyEnabled?: boolean;
    allowNestedItemsToBePublic?: boolean;
    
    // Container and storage configuration
    containers?: Record<string, ContainerConfig>;
    networkRules?: NetworkRules;
    managedIdentities?: ManagedIdentities;
    privateEndpoints?: Record<string, PrivateEndpoint>;
    
    // Role assignments for the storage account
    roleAssignments?: Record<string, RoleAssignment>;
    
    // Tags
    tags?: Record<string, string>;
}

export interface StorageAccountResult {
    storageAccount: azure.storage.StorageAccount;
    containers: Record<string, azure.storage.BlobContainer>;
    privateEndpoints: Record<string, azure.network.PrivateEndpoint>;
    name: pulumi.Output<string>;
    resourceGroupName: pulumi.Input<string>;
    primaryBlobEndpoint: pulumi.Output<string>;
    primaryEndpoints: pulumi.Output<any>;
}

export function createStorageAccount(
    name: string,
    args: StorageAccountArgs,
    opts?: pulumi.ComponentResourceOptions
): StorageAccountResult {
    // Create the storage account
    const storageAccount = new azure.storage.StorageAccount(name, {
        resourceGroupName: args.resourceGroupName,
        accountName: args.name,
        location: args.location,
        sku: {
            name: `${args.accountTier || "Standard"}_${args.accountReplicationType || "LRS"}`,
        },
        kind: args.accountKind || "StorageV2",
        
        // Security settings
        minimumTlsVersion: args.minTlsVersion || "TLS1_2",
        enableHttpsTrafficOnly: args.httpsTrafficOnlyEnabled !== false,
        allowBlobPublicAccess: args.allowNestedItemsToBePublic || false,
        allowSharedKeyAccess: args.sharedAccessKeyEnabled !== false,
        publicNetworkAccess: args.publicNetworkAccessEnabled !== false ? "Enabled" : "Disabled",
        
        // Managed identity configuration
        identity: args.managedIdentities ? {
            type: args.managedIdentities.systemAssigned && args.managedIdentities.userAssignedResourceIds?.length 
                ? "SystemAssigned,UserAssigned"
                : args.managedIdentities.userAssignedResourceIds?.length 
                ? "UserAssigned" 
                : args.managedIdentities.systemAssigned 
                ? "SystemAssigned" 
                : "None",
            userAssignedIdentities: args.managedIdentities.userAssignedResourceIds || [],
        } : undefined,
        
        // Network access rules
        networkRuleSet: args.networkRules ? {
            defaultAction: args.networkRules.defaultAction,
            bypass: args.networkRules.bypass?.join(","),
            ipRules: args.networkRules.ipRules?.map(ip => ({ iPAddressOrRange: ip, action: "Allow" })),
            virtualNetworkRules: args.networkRules.virtualNetworkSubnetIds?.map(subnetId => ({
                virtualNetworkResourceId: subnetId,
                action: "Allow",
            })),
        } : undefined,
        
        tags: args.tags,
    }, opts);

    // Create containers
    const containers: Record<string, azure.storage.BlobContainer> = {};
    if (args.containers) {
        for (const [containerKey, containerConfig] of Object.entries(args.containers)) {
            const container = new azure.storage.BlobContainer(`${name}-${containerKey}`, {
                resourceGroupName: args.resourceGroupName,
                accountName: storageAccount.name,
                containerName: containerConfig.name,
                publicAccess: containerConfig.containerAccessType === "Blob" ? "Blob" 
                    : containerConfig.containerAccessType === "Container" ? "Container" 
                    : "None",
                metadata: containerConfig.metadata,
            }, { parent: storageAccount, ...opts });
            
            containers[containerKey] = container;
            
            // Create role assignments for container
            if (containerConfig.roleAssignments) {
                for (const [roleKey, roleConfig] of Object.entries(containerConfig.roleAssignments)) {
                    new azure.authorization.RoleAssignment(`${name}-${containerKey}-${roleKey}`, {
                        scope: container.id,
                        principalId: roleConfig.principalId,
                        roleDefinitionId: roleConfig.roleDefinitionIdOrName.startsWith("/") 
                            ? roleConfig.roleDefinitionIdOrName 
                            : roleConfig.roleDefinitionIdOrName, // For simplicity, assume it's a built-in role name
                        description: roleConfig.description,
                        condition: roleConfig.condition,
                        conditionVersion: roleConfig.conditionVersion,
                        delegatedManagedIdentityResourceId: roleConfig.delegatedManagedIdentityResourceId,
                    }, { parent: container, ...opts });
                }
            }
        }
    }

    // Create private endpoints
    const privateEndpoints: Record<string, azure.network.PrivateEndpoint> = {};
    if (args.privateEndpoints) {
        for (const [peKey, peConfig] of Object.entries(args.privateEndpoints)) {
            const privateEndpoint = new azure.network.PrivateEndpoint(`${name}-${peKey}`, {
                resourceGroupName: peConfig.resourceGroupName || args.resourceGroupName,
                privateEndpointName: peConfig.name || `${name}-${peKey}`,
                location: peConfig.location || args.location,
                subnet: {
                    id: peConfig.subnetResourceId,
                },
                privateLinkServiceConnections: [{
                    name: peConfig.privateServiceConnectionName || `${name}-${peKey}-connection`,
                    privateLinkServiceId: storageAccount.id,
                    groupIds: [peConfig.subresourceName],
                }],
                customNetworkInterfaceName: peConfig.networkInterfaceName,
                tags: peConfig.tags,
            }, { parent: storageAccount, ...opts });
            
            privateEndpoints[peKey] = privateEndpoint;
            
            // Create role assignments for private endpoint
            if (peConfig.roleAssignments) {
                for (const [roleKey, roleConfig] of Object.entries(peConfig.roleAssignments)) {
                    new azure.authorization.RoleAssignment(`${name}-${peKey}-${roleKey}`, {
                        scope: privateEndpoint.id,
                        principalId: roleConfig.principalId,
                        roleDefinitionId: roleConfig.roleDefinitionIdOrName.startsWith("/") 
                            ? roleConfig.roleDefinitionIdOrName 
                            : roleConfig.roleDefinitionIdOrName, // For simplicity, assume it's a built-in role name
                        description: roleConfig.description,
                        condition: roleConfig.condition,
                        conditionVersion: roleConfig.conditionVersion,
                        delegatedManagedIdentityResourceId: roleConfig.delegatedManagedIdentityResourceId,
                    }, { parent: privateEndpoint, ...opts });
                }
            }
        }
    }

    // Create role assignments for storage account
    if (args.roleAssignments) {
        for (const [roleKey, roleConfig] of Object.entries(args.roleAssignments)) {
            new azure.authorization.RoleAssignment(`${name}-${roleKey}`, {
                scope: storageAccount.id,
                principalId: roleConfig.principalId,
                roleDefinitionId: roleConfig.roleDefinitionIdOrName.startsWith("/") 
                    ? roleConfig.roleDefinitionIdOrName 
                    : roleConfig.roleDefinitionIdOrName, // For simplicity, assume it's a built-in role name
                description: roleConfig.description,
                condition: roleConfig.condition,
                conditionVersion: roleConfig.conditionVersion,
                delegatedManagedIdentityResourceId: roleConfig.delegatedManagedIdentityResourceId,
            }, { parent: storageAccount, ...opts });
        }
    }

    return {
        storageAccount,
        containers,
        privateEndpoints,
        name: storageAccount.name,
        resourceGroupName: args.resourceGroupName,
        primaryBlobEndpoint: storageAccount.primaryEndpoints.apply(endpoints => endpoints?.blob || ""),
        primaryEndpoints: storageAccount.primaryEndpoints,
    };
}

export interface StorageResult {
    artifactsStorage: StorageAccountResult;
}

export interface StorageResults {
    environments: Record<string, StorageResult>;
}

export function createStorage(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    virtualNetworks: VirtualNetworksResult,
    providers: ProvidersResult
): StorageResults {
    const environments: Record<string, StorageResult> = {};

    Object.entries(config.environments).forEach(([envKey]) => {
        const provider = providers.environments[envKey];
        const virtualNetwork = virtualNetworks.environments[envKey];
        const artifactsResourceGroup = resourceGroups.environments[envKey]?.workload;

        if (!provider || !artifactsResourceGroup) return;

        // Create storage account for build artifacts
        const artifactsStorage = createStorageAccount(
            `${envKey}-${config.resourceNameWorkload}-artifacts`,
            {
                location: config.location,
                name: `${envKey}${config.resourceNameWorkload}artifacts`.toLowerCase().replace(/-/g, "").substring(0, 24), // Storage account names must be <= 24 chars
                resourceGroupName: pulumi.output(artifactsResourceGroup.name),
                accountTier: "Standard",
                accountReplicationType: "LRS",
                accountKind: "StorageV2",
                minTlsVersion: "TLS1_2",
                httpsTrafficOnlyEnabled: true,
                publicNetworkAccessEnabled: true,
                sharedAccessKeyEnabled: true,
                allowNestedItemsToBePublic: false,
                containers: {
                    artifacts: {
                        name: "artifacts",
                        containerAccessType: "None",
                    },
                    logs: {
                        name: "logs",
                        containerAccessType: "None",
                    },
                },
                // Network rules to restrict access if virtual network is provided
                networkRules: virtualNetwork ? {
                    defaultAction: "Deny",
                    bypass: ["AzureServices"],
                    virtualNetworkSubnetIds: [virtualNetwork.subnets.agents.resourceId],
                } : {
                    defaultAction: "Allow",
                },
            },
            { provider: provider.extendedProvider }
        );

        environments[envKey] = {
            artifactsStorage,
        };
    });

    return { environments };
}