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
const agentPools = createAgentPools(config, project.projectId, azureDevOpsProvider.provider);

// Create agents after we have dependencies (agent pools, virtual networks, resource groups)
const agents = createAgents(config, resourceGroups, virtualNetworks, providers, azureDevOpsProvider.provider, agentPools.poolNames);

const variableGroups = createVariableGroups(config, project.projectId, resourceGroups, storage, azureDevOpsProvider.provider);


// Export comprehensive resource group information for all environments
export const resourceGroupDetails = pulumi.all([resourceGroups]).apply(([rgs]) =>
    Object.entries(rgs.environments).flatMap(([envKey, envResourceGroups]) => [
        {
            environment: envKey,
            type: 'identity',
            name: envResourceGroups.identity.name,
            id: envResourceGroups.identity.id,
            workloadId: envResourceGroups.workload.id,
        },
        ...(envResourceGroups.agents ? [{
            environment: envKey,
            type: 'agents',
            name: envResourceGroups.agents.name,
            id: envResourceGroups.agents.id,
            workloadId: envResourceGroups.workload.id,
        }] : []),
        {
            environment: envKey,
            type: 'workload',
            name: envResourceGroups.workload.name,
            id: envResourceGroups.workload.id,
            workloadId: envResourceGroups.workload.id,
        },
    ])
);

// Export dev managed identity info (assuming dev environment exists)
const devPreviewIdentity = managedIdentities.userAssignedIdentities['dev-preview'];
const devUpIdentity = managedIdentities.userAssignedIdentities['dev-up'];

export const devPreviewClientId = devPreviewIdentity?.clientId;
export const devUpClientId = devUpIdentity?.clientId;
export const devPreviewPrincipalId = devPreviewIdentity?.principalId;
export const devUpPrincipalId = devUpIdentity?.principalId;
