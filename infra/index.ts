import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "./project-config";
import { current, subscription } from "./data";

// Azure modules
import { createResourceGroups } from "./azure/resource-groups";
import { createManagedIdentities } from "./azure/managed-identities";
import { createRoleAssignments } from "./azure/role-assignments";
import { createAgents } from "./azure/agents";
import { createStorage } from "./azure/storage";
import { createVirtualNetwork } from "./azure/virtual-network";

// Azure DevOps modules
import { createProject } from "./azuredevops/project";
import { createServiceConnections } from "./azuredevops/service-connections";
import { createEnvironments } from "./azuredevops/environments";
import { createGroups } from "./azuredevops/groups";
import { createAgentPools } from "./azuredevops/agents";
import { createPipelines } from "./azuredevops/pipelines";
import { createRepositories } from "./azuredevops/repositories";
import { createRepositoryFiles } from "./azuredevops/repository-files";
import { createVariableGroups } from "./azuredevops/variable-groups";

// Configuration
const config = new ProjectConfig();
const azureDevOpsOrganization = config.versionControlSystemOrganization;
const azureDevOpsProject = config.azureDevopsProject;

// Create Azure resources
const resourceGroups = createResourceGroups(config);
const managedIdentities = createManagedIdentities(config, resourceGroups, azureDevOpsOrganization, azureDevOpsProject);
const roleAssignments = createRoleAssignments(config, resourceGroups, managedIdentities, current);
const virtualNetwork = createVirtualNetwork(config, resourceGroups);
const storage = createStorage(config, resourceGroups, virtualNetwork);

// Create Azure DevOps resources
const project = createProject(config);
const serviceConnections = createServiceConnections(config, managedIdentities, current, project.projectId);
const environments = createEnvironments(config, project.projectId);
const groups = createGroups(config, project.projectId);
const agentPools = createAgentPools(config, project.projectId);

// Create agents after we have agent pools and virtual network
const agents = createAgents(config, resourceGroups, virtualNetwork, agentPools.agentPoolName);

const repositories = createRepositories(config, project.projectId, environments);
const pipelines = createPipelines(config, project.projectId, repositories, environments, serviceConnections, agentPools);
const repositoryFiles = createRepositoryFiles(config, repositories);
const variableGroups = createVariableGroups(config, project.projectId, resourceGroups, storage);

// Export important values for Azure DevOps service connection setup
export const subscriptionId = current.subscriptionId;
export const tenantId = current.tenantId;

// Export target resource group (first environment that exists)
const firstEnvironmentKey = Object.keys(config.environments)[0];
const targetResourceGroup = resourceGroups.environments[firstEnvironmentKey] || resourceGroups.state;
export const targetResourceGroupId = targetResourceGroup.id;

// Export dev managed identity info (assuming dev environment exists)
const devPlanIdentity = managedIdentities.userAssignedIdentities['dev-plan'];
const devApplyIdentity = managedIdentities.userAssignedIdentities['dev-apply'];

export const devPlanClientId = devPlanIdentity?.clientId;
export const devApplyClientId = devApplyIdentity?.clientId;
export const devPlanPrincipalId = devPlanIdentity?.principalId;
export const devApplyPrincipalId = devApplyIdentity?.principalId;

// Export configuration for Azure DevOps service connections
export const serviceConnectionConfig = {
    devPlan: {
        name: "service-connection-dev-plan",
        description: "OIDC connection for dev environment planning",
        subscriptionId: current.subscriptionId,
        subscriptionName: "Current Subscription", // Could be retrieved via a separate call if needed
        tenantId: current.tenantId,
        servicePrincipalId: devPlanIdentity?.clientId,
        scheme: "WorkloadIdentityFederation",
    },
    devApply: {
        name: "service-connection-dev-apply", 
        description: "OIDC connection for dev environment deployment",
        subscriptionId: current.subscriptionId,
        subscriptionName: "Current Subscription", // Could be retrieved via a separate call if needed
        tenantId: current.tenantId,
        servicePrincipalId: devApplyIdentity?.clientId,
        scheme: "WorkloadIdentityFederation",
    },
};
