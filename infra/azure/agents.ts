import * as pulumi from "@pulumi/pulumi";
import * as azureAgents from "../sdks/azure-agents";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { VirtualNetworksResult } from "./virtual-network";
import { ProvidersResult } from "./providers";

export interface AgentsResult {
    module: azureAgents.Module;
    containerInstanceNames: pulumi.Output<string[] | undefined>;
    containerInstanceResourceIds: pulumi.Output<string[] | undefined>;
    containerRegistryLoginServer: pulumi.Output<any | undefined>;
    containerRegistryName: pulumi.Output<any | undefined>;
    containerRegistryResourceId: pulumi.Output<any | undefined>;
}

export interface AgentsResults {
    environments: Record<string, AgentsResult>;
}

export function createAgents(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    virtualNetworks: VirtualNetworksResult,
    providers: ProvidersResult,
    agentPoolNames: Record<string, pulumi.Input<string>>
): AgentsResults {
    const environments: Record<string, AgentsResult> = {};

    if (!config.useSelfHostedAgents) {
        return { environments };
    }

    Object.entries(config.environments).forEach(([envKey]) => {
        const provider = providers.environments[envKey];
        const agentsResourceGroup = resourceGroups.environments[envKey]?.agents;
        const virtualNetwork = virtualNetworks.environments[envKey];
        const agentPoolName = agentPoolNames[envKey];
        
        if (!provider || !agentsResourceGroup || !virtualNetwork || !agentPoolName) return;

        const azureDevopsAgents = new azureAgents.Module(`${envKey}-azure-devops-agents`, {
            resource_group_creation_enabled: false,
            resource_group_name: agentsResourceGroup.name,
            postfix: config.agentComputePostfixName,
            container_instance_name_prefix: `${envKey}-${config.containerInstancePrefixName}`,
            container_registry_name: `${envKey}${config.containerRegistryName}`,
            location: config.location,
            compute_types: [config.selfHostedAgentType],
            container_instance_count: 4,
            version_control_system_type: "azuredevops",
            version_control_system_personal_access_token: config.personalAccessToken,
            version_control_system_organization: config.versionControlSystemOrganization,
            version_control_system_pool_name: agentPoolName,
            virtual_network_creation_enabled: false,
            virtual_network_id: virtualNetwork.resourceId,
            container_app_subnet_id: virtualNetwork.subnets.agents.resourceId,
            container_instance_subnet_id: virtualNetwork.subnets.agents.resourceId,
            container_registry_private_endpoint_subnet_id: virtualNetwork.subnets.privateEndpoints.resourceId,
            container_instance_use_availability_zones: config.agentUseAvailabilityZones,
        }, { provider });

        environments[envKey] = {
            module: azureDevopsAgents,
            containerInstanceNames: azureDevopsAgents.container_instance_names,
            containerInstanceResourceIds: azureDevopsAgents.container_instance_resource_ids,
            containerRegistryLoginServer: azureDevopsAgents.container_registry_login_server,
            containerRegistryName: azureDevopsAgents.container_registry_name,
            containerRegistryResourceId: azureDevopsAgents.container_registry_resource_id,
        };
    });

    return { environments };
}
