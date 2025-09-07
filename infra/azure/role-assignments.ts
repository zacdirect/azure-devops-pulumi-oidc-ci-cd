import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { ManagedIdentitiesResult } from "./managed-identities";

export interface RoleAssignmentsResult {
    assignments: Record<string, azure.authorization.RoleAssignment>;
}

export function createRoleAssignments(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    managedIdentities: ManagedIdentitiesResult,
    current: pulumi.Output<azure.authorization.GetClientConfigResult>
): RoleAssignmentsResult {
    const assignments: Record<string, azure.authorization.RoleAssignment> = {};

    Object.entries(config.environments).forEach(([envKey]) => {
        const targetResourceGroup = resourceGroups.environments[envKey];
        if (!targetResourceGroup) return;

        // Reader role for plan identity
        const planIdentity = managedIdentities.userAssignedIdentities[`${envKey}-plan`];
        if (planIdentity) {
            assignments[`${envKey}-plan-reader`] = new azure.authorization.RoleAssignment(`${envKey}-plan-reader`, {
                scope: targetResourceGroup.id,
                roleDefinitionId: pulumi.interpolate`/subscriptions/${current.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7`, // Reader role
                principalId: planIdentity.principalId,
                principalType: "ServicePrincipal",
            });
        }

        // Contributor role for apply identity
        const applyIdentity = managedIdentities.userAssignedIdentities[`${envKey}-apply`];
        if (applyIdentity) {
            assignments[`${envKey}-apply-contributor`] = new azure.authorization.RoleAssignment(`${envKey}-apply-contributor`, {
                scope: targetResourceGroup.id,
                roleDefinitionId: pulumi.interpolate`/subscriptions/${current.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c`, // Contributor role
                principalId: applyIdentity.principalId,
                principalType: "ServicePrincipal",
            });
        }
    });

    return {
        assignments,
    };
}
