import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "../project-config";

export interface ResourceGroupsResult {
    state: azure.resources.ResourceGroup;
    identity: azure.resources.ResourceGroup;
    agents?: azure.resources.ResourceGroup;
    environments: Record<string, azure.resources.ResourceGroup>;
}

export function createResourceGroups(config: ProjectConfig): ResourceGroupsResult {
    // Core resource groups
    const state = new azure.resources.ResourceGroup(config.resourceGroupStateName, {
        location: config.location,
    });

    const identity = new azure.resources.ResourceGroup(config.resourceGroupIdentityName, {
        location: config.location,
    });

    // Optional agents resource group (if using self-hosted agents)
    let agents: azure.resources.ResourceGroup | undefined;
    if (config.useSelfHostedAgents) {
        agents = new azure.resources.ResourceGroup(config.resourceGroupAgentsName, {
            location: config.location,
        });
    }

    // Environment-specific resource groups
    const environments: Record<string, azure.resources.ResourceGroup> = {};
    Object.entries(config.environments).forEach(([envKey, envValue]) => {
        if (envValue.resourceGroupCreate) {
            // Logical name will be transformed by autonaming rules: rg-${name}
            environments[envKey] = new azure.resources.ResourceGroup(`${config.resourceNameWorkload}-${envKey}-${config.location}`, {
                location: config.location,
            });
        }
    });

    return {
        state,
        identity,
        agents,
        environments,
    };
}
