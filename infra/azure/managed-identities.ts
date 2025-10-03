import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { ProvidersResult, getProviderForEnvironment } from "./providers";
import { getStandardTags } from "../shared/common";
import { ResourceGroupNotFoundError } from "../shared/errors";

export interface ManagedIdentitiesResult {
    userAssignedIdentities: Record<string, azure.managedidentity.UserAssignedIdentity>;
    federatedCredentials: Record<string, azure.managedidentity.FederatedIdentityCredential>;
}

export function createManagedIdentities(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    azureDevOpsOrganization: string,
    azureDevOpsProject: string,
    providers: ProvidersResult
): ManagedIdentitiesResult {
    pulumi.log.debug("Starting managed identities creation function");
    pulumi.log.debug(`Resource groups object keys: ${Object.keys(resourceGroups.environments)}`);
    pulumi.log.debug(`Available environments in config: ${Object.keys(config.environments)}`);
    
    const userAssignedIdentities: Record<string, azure.managedidentity.UserAssignedIdentity> = {};
    const federatedCredentials: Record<string, azure.managedidentity.FederatedIdentityCredential> = {};

    // Create managed identities for each environment and operation type
    Object.keys(config.environments).forEach(envKey => {
        pulumi.log.debug(`Processing managed identities for environment: ${envKey}`);
        
        ['preview', 'up'].forEach(operation => {
            const identityKey = `${envKey}-${operation}`;
            const provider = getProviderForEnvironment(providers, envKey).extendedProvider;
            const envResourceGroups = resourceGroups.environments[envKey];

            pulumi.log.debug(`Checking resource groups for environment: ${envKey}`);
            pulumi.log.debug(`Resource groups object keys: ${Object.keys(resourceGroups.environments)}`);
            pulumi.log.debug(`envResourceGroups for ${envKey}: ${envResourceGroups ? 'found' : 'NOT FOUND'}`);
            
            if (!envResourceGroups) {
                pulumi.log.debug(`Resource groups not found for environment '${envKey}'`);
                throw new ResourceGroupNotFoundError(envKey);
            }

            pulumi.log.debug(`Found resource groups for environment '${envKey}', creating identity: ${identityKey}`);

            // Create User Assigned Managed Identity in the environment's identity resource group
            // Logical name will be transformed by autonaming rules in Pulumi.yaml: uami-${name}
            userAssignedIdentities[identityKey] = new azure.managedidentity.UserAssignedIdentity(`${config.resourceNameWorkload}-${envKey}-${operation}`, {
                resourceGroupName: envResourceGroups.identity.name,
                location: config.location,
                tags: getStandardTags(config, envKey, 'UserAssignedIdentity', { Operation: operation }),
            }, { provider });

            // Create Federated Identity Credential
            // Logical name will be transformed by autonaming rules: fic-${name}
            // Sanitize the project name to meet Azure naming requirements (alphanumeric, hyphens, underscores only)
            const sanitizedProjectName = config.azureDevopsProject.replace(/[^a-zA-Z0-9-_]/g, '-');
            federatedCredentials[identityKey] = new azure.managedidentity.FederatedIdentityCredential(`${sanitizedProjectName}-${envKey}-${operation}`, {
                resourceGroupName: envResourceGroups.identity.name,
                resourceName: userAssignedIdentities[identityKey].name,
                audiences: [config.serviceConnectionConfig.oidcAudience],
                issuer: pulumi.interpolate`https://vstoken.dev.azure.com/${azureDevOpsOrganization}`,
                subject: pulumi.interpolate`sc://${azureDevOpsOrganization}/${azureDevOpsProject}/service-connection-${identityKey}`,
            }, { provider });
        });
    });

    return {
        userAssignedIdentities,
        federatedCredentials,
    };
}
