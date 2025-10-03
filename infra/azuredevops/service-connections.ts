import * as azuredevops from "@pulumi/azuredevops";
import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import { ProjectConfig } from "../project-config";
import { ManagedIdentitiesResult } from "../azure/managed-identities";
import { RepositoriesResult } from "./repositories";
import { GroupsResult } from "./groups";
import { EnvironmentsResult } from "./environments";

export interface ServiceConnectionsResult {
    connections: Record<string, azuredevops.ServiceEndpointAzureRM>;
    approvalChecks: azuredevops.CheckApproval[];
    exclusiveLocks: azuredevops.CheckExclusiveLock[];
    requiredTemplateChecks: azuredevops.CheckRequiredTemplate[];
}

export function createServiceConnections(
    config: ProjectConfig,
    managedIdentities: ManagedIdentitiesResult,
    azureDevOpsProjectId: pulumi.Input<string>,
    repositories: RepositoriesResult,
    groups: GroupsResult,
    environments: EnvironmentsResult
): ServiceConnectionsResult {
    const connections: Record<string, azuredevops.ServiceEndpointAzureRM> = {};
    const approvalChecks: azuredevops.CheckApproval[] = [];
    const exclusiveLocks: azuredevops.CheckExclusiveLock[] = [];
    const requiredTemplateChecks: azuredevops.CheckRequiredTemplate[] = [];

    // Create service connections for each environment and operation type
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        const azureDetails = environments.azureDetails[envKey];
        if (!azureDetails) return;
        
        ['preview', 'up'].forEach(operation => {
            const connectionKey = `${envKey}-${operation}`;
            const identity = managedIdentities.userAssignedIdentities[connectionKey];
            
            if (identity) {
                // Use Azure details from environments
                const tenantId = pulumi.output(azureDetails.tenantId || "");
                const subscriptionId = pulumi.output(azureDetails.subscriptionId || "");
                
                // Create service connection
                const serviceConnection = new azuredevops.ServiceEndpointAzureRM(`service-connection-${connectionKey}`, {
                    projectId: azureDevOpsProjectId,
                    serviceEndpointName: `service-connection-${connectionKey}`,
                    description: "Managed by Pulumi",
                    serviceEndpointAuthenticationScheme: "WorkloadIdentityFederation",
                    credentials: {
                        serviceprincipalid: identity.clientId,
                    },
                    azurermSpnTenantid: tenantId,
                    azurermSubscriptionId: subscriptionId,
                    azurermSubscriptionName: azureDetails.subscriptionName,
                });

                connections[connectionKey] = serviceConnection;

                // Create approval check for 'up' operations if approvers are configured
                if (operation === 'up' && envConfig.hasApproval && Object.keys(config.approvers).length > 0) {
                    const approvalCheck = new azuredevops.CheckApproval(`approval-check-${connectionKey}`, {
                        projectId: azureDevOpsProjectId,
                        targetResourceId: serviceConnection.id,
                        targetResourceType: "endpoint",
                        requesterCanApprove: Object.keys(config.approvers).length === 1,
                        approvers: [groups.approversGroup.originId],
                        timeout: config.serviceConnectionConfig.approvalTimeoutHours * 3600, // Convert hours to seconds
                    });
                    approvalChecks.push(approvalCheck);
                }

                // Create exclusive lock for all service connections
                const exclusiveLock = new azuredevops.CheckExclusiveLock(`exclusive-lock-${connectionKey}`, {
                    projectId: azureDevOpsProjectId,
                    targetResourceId: serviceConnection.id,
                    targetResourceType: "endpoint",
                    timeout: config.serviceConnectionConfig.exclusiveLockTimeoutHours * 3600, // Convert hours to seconds
                });
                exclusiveLocks.push(exclusiveLock);

                // Create required template checks
                const requiredTemplates = operation === 'preview' ? 
                    ["pipelines/templates/ci-template.yaml", "pipelines/templates/cd-template.yaml"] : 
                    ["pipelines/templates/cd-template.yaml"];

                requiredTemplates.forEach((templatePath, index) => {
                    const requiredTemplateCheck = new azuredevops.CheckRequiredTemplate(`required-template-${connectionKey}-${index}`, {
                        projectId: azureDevOpsProjectId,
                        targetResourceId: serviceConnection.id,
                        targetResourceType: "endpoint",
                        requiredTemplates: [{
                            repositoryType: "azuregit",
                            repositoryName: pulumi.interpolate`${config.azureDevopsProject}/${repositories.templateRepository.name}`,
                            repositoryRef: repositories.templateRepository.defaultBranch,
                            templatePath: templatePath,
                        }],
                    });
                    requiredTemplateChecks.push(requiredTemplateCheck);
                });
            }
        });
    });

    return {
        connections,
        approvalChecks,
        exclusiveLocks,
        requiredTemplateChecks,
    };
}
