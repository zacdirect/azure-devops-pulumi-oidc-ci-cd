import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "./project-config";

// Azure modules
import { createProviders } from "./azure/providers";
import { createResourceGroups } from "./azure/resource-groups";
import { createManagedIdentities } from "./azure/managed-identities";
import { createRoleAssignments } from "./azure/role-assignments";
import { createAgents } from "./azure/agents";
import { createStorage } from "./azure/storage";
import { createVirtualNetworks } from "./azure/virtual-network";

// Azure DevOps modules
import { createAzureDevOpsProvider } from "./azuredevops/provider";
import { createProject } from "./azuredevops/project";
import { createServiceConnections } from "./azuredevops/service-connections";
import { createEnvironments } from "./azuredevops/environments";
import { createGroups } from "./azuredevops/groups";
import { createAgentPools } from "./azuredevops/agents";
import { createPipelines } from "./azuredevops/pipelines";
// import { createRepositories } from "./azuredevops/repositories";
import { createRepositoryFiles } from "./azuredevops/repository-files";
import { createVariableGroups } from "./azuredevops/variable-groups";

// Configuration
const config = new ProjectConfig();
const azureDevOpsOrganization = config.versionControlSystemOrganization;
const azureDevOpsProject = config.azureDevopsProject;

// Create Azure providers first
const providers = createProviders(config);

// Create Azure DevOps provider
const azureDevOpsProvider = createAzureDevOpsProvider(config);

// Create Azure resources with explicit providers in dependency order
const resourceGroups = createResourceGroups(config, providers);
const virtualNetworks = createVirtualNetworks(config, resourceGroups, providers);
const managedIdentities = createManagedIdentities(config, resourceGroups, azureDevOpsOrganization, azureDevOpsProject, providers);
const roleAssignments = createRoleAssignments(config, resourceGroups, managedIdentities, providers);
const storage = createStorage(config, resourceGroups, virtualNetworks, providers);

// Create Azure DevOps resources with explicit provider
const project = createProject(config, azureDevOpsProvider.provider);
const environments = createEnvironments(config, project.projectId, providers, azureDevOpsProvider.provider);
const groups = createGroups(config, project.projectId, azureDevOpsProvider.provider);
// const repositories = createRepositories(config, project.projectId, environments, azureDevOpsProvider.provider);
const agentPools = createAgentPools(config, project.projectId, azureDevOpsProvider.provider);
// const serviceConnections = createServiceConnections(config, managedIdentities, project.projectId, repositories, groups, environments);

// Create agents after we have dependencies (agent pools, virtual networks, resource groups)
const agents = createAgents(config, resourceGroups, virtualNetworks, providers, agentPools.poolNames);

// Create pipelines with all dependencies
// const pipelines = createPipelines(config, project.projectId, repositories, environments, serviceConnections, agentPools);
// const repositoryFiles = createRepositoryFiles(config, repositories);
const variableGroups = createVariableGroups(config, project.projectId, resourceGroups, storage, azureDevOpsProvider.provider);

// Export important values for the first environment (dev typically)
const firstEnvironmentKey = Object.keys(config.environments)[0];
const firstEnvironmentProvider = providers.environments[firstEnvironmentKey];

export const subscriptionId = firstEnvironmentProvider.subscriptionName;
export const tenantId = pulumi.output("tenant-from-provider-config");

// Export target resource group (first environment that exists)
const firstEnvironmentResourceGroups = resourceGroups.environments[firstEnvironmentKey];
if (!firstEnvironmentResourceGroups) {
    throw new Error(`No resource groups found for environment '${firstEnvironmentKey}'`);
}
export const targetResourceGroupId = firstEnvironmentResourceGroups.workload.id;

// Export dev managed identity info (assuming dev environment exists)
const devPreviewIdentity = managedIdentities.userAssignedIdentities['dev-preview'];
const devUpIdentity = managedIdentities.userAssignedIdentities['dev-up'];

export const devPreviewClientId = devPreviewIdentity?.clientId;
export const devUpClientId = devUpIdentity?.clientId;
export const devPreviewPrincipalId = devPreviewIdentity?.principalId;
export const devUpPrincipalId = devUpIdentity?.principalId;
