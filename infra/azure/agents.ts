import * as pulumi from "@pulumi/pulumi";
import * as azureAgents from "../sdks/azure-agents";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { VirtualNetworkResult } from "./virtual-network";

export interface AgentsResult {
    module: azureAgents.Module;
    containerInstanceNames: pulumi.Output<string[] | undefined>;
    containerInstanceResourceIds: pulumi.Output<string[] | undefined>;
    containerRegistryLoginServer: pulumi.Output<any | undefined>;
    containerRegistryName: pulumi.Output<any | undefined>;
    containerRegistryResourceId: pulumi.Output<any | undefined>;
}

export function createAgents(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    virtualNetwork: VirtualNetworkResult,
    agentPoolName: pulumi.Input<string>
): AgentsResult | undefined {
    if (!config.useSelfHostedAgents || !resourceGroups.agents) {
        return undefined;
    }

    const azureDevopsAgents = new azureAgents.Module("azure-devops-agents", {
        resource_group_creation_enabled: false,
        resource_group_name: resourceGroups.agents.name,
        postfix: config.agentComputePostfixName,
        container_instance_name_prefix: config.containerInstancePrefixName,
        container_registry_name: config.containerRegistryName,
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
    });

    return {
        module: azureDevopsAgents,
        containerInstanceNames: azureDevopsAgents.container_instance_names,
        containerInstanceResourceIds: azureDevopsAgents.container_instance_resource_ids,
        containerRegistryLoginServer: azureDevopsAgents.container_registry_login_server,
        containerRegistryName: azureDevopsAgents.container_registry_name,
        containerRegistryResourceId: azureDevopsAgents.container_registry_resource_id,
    };
}
