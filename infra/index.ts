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

// Create Azure providers first
const providers = createProviders(config);

// Create Azure resources with explicit providers
const resourceGroups = createResourceGroups(config, providers);
const managedIdentities = createManagedIdentities(config, resourceGroups, azureDevOpsOrganization, azureDevOpsProject, providers);
const roleAssignments = createRoleAssignments(config, resourceGroups, managedIdentities, providers);
const virtualNetworks = createVirtualNetworks(config, resourceGroups, providers);
const storage = createStorage(config, resourceGroups, virtualNetworks, providers);

// Create Azure DevOps resources
const project = createProject(config);
const environments = createEnvironments(config, project.projectId, providers);
const groups = createGroups(config, project.projectId);
const repositories = createRepositories(config, project.projectId, environments);
const serviceConnections = createServiceConnections(config, managedIdentities, project.projectId, repositories, groups, environments);
const agentPools = createAgentPools(config, project.projectId);

// Create agents after we have agent pools and virtual network
const agents = createAgents(config, resourceGroups, virtualNetworks, providers, agentPools.poolNames);

const pipelines = createPipelines(config, project.projectId, repositories, environments, serviceConnections, agentPools);
const repositoryFiles = createRepositoryFiles(config, repositories);
const variableGroups = createVariableGroups(config, project.projectId, resourceGroups, storage);

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

// Main async function to handle provider creation and resource deployment
(async () => {
    // Create Azure providers first (async to resolve runtime values)
    const providers = await createProviders(config);

    // Create Azure resources with explicit providers
    const resourceGroups = createResourceGroups(config, providers);
    const managedIdentities = createManagedIdentities(config, resourceGroups, azureDevOpsOrganization, azureDevOpsProject, providers);
    const roleAssignments = createRoleAssignments(config, resourceGroups, managedIdentities, providers);
    const virtualNetworks = createVirtualNetworks(config, resourceGroups, providers);
    const storage = createStorage(config, resourceGroups, virtualNetworks, providers);

    // Create Azure DevOps resources
    const project = createProject(config);
    const environments = createEnvironments(config, project.projectId, providers);
    const groups = createGroups(config, project.projectId);
    const repositories = createRepositories(config, project.projectId, environments);
    const serviceConnections = createServiceConnections(config, managedIdentities, project.projectId, repositories, groups, environments);
    const agentPools = createAgentPools(config, project.projectId);

    // Create agents after we have agent pools and virtual network
    const agents = createAgents(config, resourceGroups, virtualNetworks, providers, agentPools.poolNames);

    const pipelines = createPipelines(config, project.projectId, repositories, environments, serviceConnections, agentPools);
    const repositoryFiles = createRepositoryFiles(config, repositories);
    const variableGroups = createVariableGroups(config, project.projectId, resourceGroups, storage);

    // Export important values for the first environment (dev typically)
    const firstEnvironmentKey = Object.keys(config.environments)[0];
    const firstEnvironmentProvider = providers.environments[firstEnvironmentKey];

    // Note: Exports need to be at module level, so we'll handle them outside the async function
    return {
        providers,
        resourceGroups,
        managedIdentities,
        firstEnvironmentKey,
        firstEnvironmentProvider
    };
})().then((resources) => {
    // Module-level exports using the resolved resources
    exports.subscriptionId = resources.firstEnvironmentProvider.subscriptionName;
    exports.tenantId = pulumi.output("tenant-from-provider-config");

    // Export target resource group (first environment that exists)
    const firstEnvironmentResourceGroups = resources.resourceGroups.environments[resources.firstEnvironmentKey];
    if (!firstEnvironmentResourceGroups) {
        throw new Error(`No resource groups found for environment '${resources.firstEnvironmentKey}'`);
    }
    exports.targetResourceGroupId = firstEnvironmentResourceGroups.workload.id;

    // Export dev managed identity info (assuming dev environment exists)
    const devPreviewIdentity = resources.managedIdentities.userAssignedIdentities['dev-preview'];
    const devUpIdentity = resources.managedIdentities.userAssignedIdentities['dev-up'];

    exports.devPreviewClientId = devPreviewIdentity?.clientId;
    exports.devUpClientId = devUpIdentity?.clientId;
    exports.devPreviewPrincipalId = devPreviewIdentity?.principalId;
    exports.devUpPrincipalId = devUpIdentity?.principalId;
}).catch((error) => {
    console.error("Error during resource deployment:", error);
    throw error;
});
