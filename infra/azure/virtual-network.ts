import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "./resource-groups";
import { ProvidersResult } from "./providers";

export interface VirtualNetworkSubnet {
    resourceId: pulumi.Output<string>;
    addressPrefix: string;
}

export interface VirtualNetworkSubnets {
    agents: VirtualNetworkSubnet;
    privateEndpoints: VirtualNetworkSubnet;
}

export interface VirtualNetworkResult {
    resourceId: pulumi.Output<string>;
    name: pulumi.Output<string>;
    subnets: VirtualNetworkSubnets;
}

export interface VirtualNetworksResult {
    environments: Record<string, VirtualNetworkResult>;
}

export function createVirtualNetworks(
    config: ProjectConfig,
    resourceGroups: ResourceGroupsResult,
    providers: ProvidersResult
): VirtualNetworksResult {
    const environments: Record<string, VirtualNetworkResult> = {};

    Object.entries(config.environments).forEach(([envKey]) => {
        const provider = providers.environments[envKey];
        const agentsResourceGroup = resourceGroups.environments[envKey]?.agents;
        
        if (!provider || !agentsResourceGroup) return;
        
        environments[envKey] = createVirtualNetworkForEnvironment(
            config, 
            envKey, 
            agentsResourceGroup, 
            provider
        );
    });

    return { environments };
}

function createVirtualNetworkForEnvironment(
    config: ProjectConfig,
    environmentKey: string,
    agentsResourceGroup: azure.resources.ResourceGroup,
    provider: azure.Provider
): VirtualNetworkResult {
    // Calculate subnet CIDR blocks based on the address space and subnet sizes
    const addressSpace = config.addressSpace; // e.g., "10.0.10.0/24"
    const subnetsAndSizes = config.subnetsAndSizes; // { agents: 27, private_endpoints: 29 }
    
    // Parse the base network address
    const [baseNetwork, basePrefixLength] = addressSpace.split('/');
    const basePrefixNum = parseInt(basePrefixLength);
    
    // For simplicity, we'll calculate sequential subnets from the base network
    // In a real implementation, you might want more sophisticated CIDR calculation
    const baseNetworkParts = baseNetwork.split('.').map(x => parseInt(x));
    
    // Calculate agent subnet (e.g., 10.0.10.0/27)
    const agentSubnetPrefix = `${baseNetwork}/${subnetsAndSizes.agents}`;
    
    // Calculate private endpoints subnet by incrementing the third octet for simplicity
    // This is a simplified approach - production code might use a proper CIDR library
    const privateEndpointsBase = `${baseNetworkParts[0]}.${baseNetworkParts[1]}.${baseNetworkParts[2] + 1}.0`;
    const privateEndpointsSubnetPrefix = `${privateEndpointsBase}/${subnetsAndSizes.private_endpoints}`;
    
    // Create the virtual network
    const vnet = new azure.network.VirtualNetwork(`${environmentKey}-vnet`, {
        resourceGroupName: agentsResourceGroup.name,
        location: config.location,
        addressSpace: {
            addressPrefixes: [config.addressSpace],
        },
        enableVmProtection: true,
    }, { provider });

    // Create agents subnet with container instance delegation
    const agentsSubnet = new azure.network.Subnet(`${environmentKey}-agents-subnet`, {
        resourceGroupName: agentsResourceGroup.name,
        virtualNetworkName: vnet.name,
        addressPrefix: agentSubnetPrefix,
        defaultOutboundAccess: false,
        delegations: [
            {
                name: "Microsoft.ContainerInstance/containerGroups",
                serviceName: "Microsoft.ContainerInstance/containerGroups",
            },
        ],
        privateEndpointNetworkPolicies: "Disabled",
        privateLinkServiceNetworkPolicies: "Enabled",
    }, { parent: vnet, provider });

    // Create private endpoints subnet
    const privateEndpointsSubnet = new azure.network.Subnet(`${environmentKey}-private-endpoints-subnet`, {
        resourceGroupName: agentsResourceGroup.name,
        virtualNetworkName: vnet.name,
        addressPrefix: privateEndpointsSubnetPrefix,
        defaultOutboundAccess: false,
        privateEndpointNetworkPolicies: "Disabled",
        privateLinkServiceNetworkPolicies: "Enabled",
    }, { parent: vnet, provider });

    return {
        resourceId: vnet.id,
        name: vnet.name,
        subnets: {
            agents: {
                resourceId: agentsSubnet.id,
                addressPrefix: agentSubnetPrefix,
            },
            privateEndpoints: {
                resourceId: privateEndpointsSubnet.id,
                addressPrefix: privateEndpointsSubnetPrefix,
            },
        }
    };
}
