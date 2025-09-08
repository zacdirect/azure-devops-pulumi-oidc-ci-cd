import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { ManagedIdentitiesResult } from "./managed-identities";
import { ProvidersResult } from "./providers";

export interface RoleAssignmentsResult {
    assignments: Record<string, azure.authorization.RoleAssignment>;
}

export function createRoleAssignments(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    managedIdentities: ManagedIdentitiesResult,
    providers: ProvidersResult
): RoleAssignmentsResult {
    const assignments: Record<string, azure.authorization.RoleAssignment> = {};

    Object.entries(config.environments).forEach(([envKey]) => {
        const provider = providers.environments[envKey];
        const workloadResourceGroup = resourceGroups.environments[envKey]?.workload;
        if (!provider || !workloadResourceGroup) return;

        // Get resolved provider configuration for this environment
        const resolvedConfig = config.resolveEnvironmentProvider(envKey);

        // Reader role for preview identity
        const previewIdentity = managedIdentities.userAssignedIdentities[`${envKey}-preview`];
        if (previewIdentity) {
            assignments[`${envKey}-preview-reader`] = new azure.authorization.RoleAssignment(`${envKey}-preview-reader`, {
                scope: workloadResourceGroup.id,
                roleDefinitionId: `/subscriptions/${resolvedConfig.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`, // Reader role
                principalId: previewIdentity.principalId,
                principalType: "ServicePrincipal",
            }, { provider });
        }

        // Contributor role for up identity
        const upIdentity = managedIdentities.userAssignedIdentities[`${envKey}-up`];
        if (upIdentity) {
            assignments[`${envKey}-up-contributor`] = new azure.authorization.RoleAssignment(`${envKey}-up-contributor`, {
                scope: workloadResourceGroup.id,
                roleDefinitionId: `/subscriptions/${resolvedConfig.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c`, // Contributor role
                principalId: upIdentity.principalId,
                principalType: "ServicePrincipal",
            }, { provider });
        }
    });

    return {
        assignments,
    };
}
