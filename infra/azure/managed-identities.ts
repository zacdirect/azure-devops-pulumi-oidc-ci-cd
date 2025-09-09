import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { ProvidersResult, getProviderForEnvironment } from "./providers";

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


    /* Need to see about where to do this for Pulumi ESC and then we can just use providers from there for provisioning the rest
    // Create an Azure AD application

    const cicdApp = new azure.Application(`${appName}-pulumi-esc-auth`, {
        displayName: `${toTitleCase(appName)} Pulumi and Azure DevOps OIDC Connection`,
        owners: [current.then(current => current.objectId)],
    });

    const servicePrincipal = new azure.ServicePrincipal(`${appName}-service-principal`, {
        clientId: cicdApp.clientId,
        appRoleAssignmentRequired: false,
        owners: [current.then(current => current.objectId)],
    });


    const builtInContributorRoleId = "b24988ac-6180-42a0-ab88-20f7382dd24c"; // https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/privileged#contributor
    new azure.authorization.RoleAssignment(`${appName}-service-principal-contributor`, {
        roleDefinitionId: `/subscriptions/${cliContext.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${builtInContributorRoleId}`,
        principalId: servicePrincipal.objectId,
        principalType: azure.authorization.PrincipalType.ServicePrincipal,
        scope: `subscriptions/${current.subscriptionId}`,
    });

    */


    // Create managed identities for each environment and operation type
    Object.keys(config.environments).forEach(envKey => {
        pulumi.log.debug(`Processing managed identities for environment: ${envKey}`);
        
        ['preview', 'up'].forEach(operation => {
            const identityKey = `${envKey}-${operation}`;
            const envProvider = getProviderForEnvironment(providers, envKey);
            const envResourceGroups = resourceGroups.environments[envKey];

            pulumi.log.debug(`Checking resource groups for environment: ${envKey}`);
            pulumi.log.debug(`Resource groups object keys: ${Object.keys(resourceGroups.environments)}`);
            pulumi.log.debug(`envResourceGroups for ${envKey}: ${envResourceGroups ? 'found' : 'NOT FOUND'}`);
            
            if (!envResourceGroups) {
                pulumi.log.debug(`Resource groups not found for environment '${envKey}'`);
                throw new Error(`Resource groups not found for environment '${envKey}'`);
            }

            pulumi.log.debug(`Found resource groups for environment '${envKey}', creating identity: ${identityKey}`);

            // Create User Assigned Managed Identity in the environment's identity resource group
            // Logical name will be transformed by autonaming rules in Pulumi.yaml: uami-${name}
            userAssignedIdentities[identityKey] = new azure.managedidentity.UserAssignedIdentity(`${config.resourceNameWorkload}-${envKey}-${operation}`, {
                resourceGroupName: envResourceGroups.identity.name,
                location: config.location,
            }, { provider: envProvider });

            // Create Federated Identity Credential
            // Logical name will be transformed by autonaming rules: fic-${name}
            federatedCredentials[identityKey] = new azure.managedidentity.FederatedIdentityCredential(`${config.azureDevopsProject}-${envKey}-${operation}`, {
                resourceGroupName: envResourceGroups.identity.name,
                resourceName: userAssignedIdentities[identityKey].name,
                audiences: ["api://AzureADTokenExchange"],
                issuer: pulumi.interpolate`https://vstoken.dev.azure.com/${azureDevOpsOrganization}`,
                subject: pulumi.interpolate`sc://${azureDevOpsOrganization}/${azureDevOpsProject}/service-connection-${identityKey}`,
            }, { provider: envProvider });
        });
    });

    return {
        userAssignedIdentities,
        federatedCredentials,
    };
}
