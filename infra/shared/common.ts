import { ProjectConfig } from '../project-config';

/**
 * Common types and utilities shared across the infrastructure.
 */

/**
 * Generic result interface for resources created per environment.
 */
export interface ResourceResult<T> {
    environments: Record<string, T>;
}

/**
 * Service for generating standardized resource names according to Azure naming conventions.
 * Uses the format: <prefix>-<workload>-<purpose>-<environment>-<location>-<sequence>
 */
export class ResourceNamingService {
    constructor(private config: ProjectConfig) {}

    /**
     * Generate a standardized resource name.
     * @param resourceType - Type of resource (e.g., 'ResourceGroup', 'StorageAccount')
     * @param environment - Environment name (e.g., 'dev', 'test', 'prod')
     * @param purpose - Optional purpose/role of the resource (e.g., 'identity', 'agents')
     * @returns Standardized resource name
     */
    public getResourceName(
        resourceType: string,
        environment: string,
        purpose?: string
    ): string {
        const prefix = this.getResourcePrefix(resourceType);
        const parts = [
            prefix,
            this.config.resourceNameWorkload,
            purpose,
            environment,
            this.config.location,
            this.config.resourceNameSequenceStart.toString().padStart(3, '0')
        ].filter(Boolean);

        return parts.join('-');
    }

    /**
     * Get the standard Azure abbreviation prefix for a resource type.
     * Based on: https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations
     */
    private getResourcePrefix(resourceType: string): string {
        const prefixes: Record<string, string> = {
            'ResourceGroup': 'rg',
            'StorageAccount': 'st',
            'VirtualNetwork': 'vnet',
            'Subnet': 'snet',
            'NetworkSecurityGroup': 'nsg',
            'UserAssignedIdentity': 'id',
            'FederatedIdentityCredential': 'fic',
            'PrivateEndpoint': 'pe',
            'NatGateway': 'ng',
            'PublicIpAddress': 'pip',
            'ContainerInstance': 'aci',
            'ContainerRegistry': 'cr',
            'KeyVault': 'kv',
            'LogAnalyticsWorkspace': 'log',
            'ApplicationInsights': 'appi'
        };
        return prefixes[resourceType] || resourceType.toLowerCase();
    }
}

/**
 * Generate standardized tags for Azure resources.
 * Combines default tags from config with environment and resource-specific tags.
 * 
 * @param config - Project configuration
 * @param environment - Environment name
 * @param resourceType - Type of resource being tagged
 * @param additionalTags - Optional additional tags to merge
 * @returns Combined tags object
 */
export function getStandardTags(
    config: ProjectConfig,
    environment: string,
    resourceType: string,
    additionalTags?: Record<string, string>
): Record<string, string> {
    const environmentConfig = config.getEnvironment(environment);
    
    return {
        Environment: environmentConfig?.displayName || environment,
        EnvironmentKey: environment,
        Workload: config.resourceNameWorkload,
        ResourceType: resourceType,
        ManagedBy: 'Pulumi',
        Project: config.azureDevopsProject,
        Location: config.location,
        ...config.defaultTags,
        ...additionalTags
    };
}

/**
 * Retry an operation with exponential backoff.
 * Useful for handling transient failures in Azure operations.
 * 
 * @param operation - Function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Initial delay in milliseconds (default: 1000)
 * @returns Result of the operation
 */
export async function executeWithRetry<T>(
    operation: () => Promise<T> | T,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await Promise.resolve(operation());
        } catch (error) {
            lastError = error as Error;
            if (attempt === maxRetries) break;

            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2;
        }
    }

    throw lastError!;
}
