import * as azure from "@pulumi/azure-native";
import { ProjectConfig } from "../project-config";
import { ProvidersResult, getProviderForEnvironment } from "./providers";

export interface ResourceGroupsResult {
    environments: Record<string, {
        identity: azure.resources.ResourceGroup;
        agents?: azure.resources.ResourceGroup;
        workload: azure.resources.ResourceGroup;
    }>;
}

export function createResourceGroups(config: ProjectConfig, providers: ProvidersResult): ResourceGroupsResult {
    const environments: Record<string, {
        identity: azure.resources.ResourceGroup;
        agents?: azure.resources.ResourceGroup;
        workload: azure.resources.ResourceGroup;
    }> = {};

    // Create resource groups for each environment independently
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        if (!envConfig.resourceGroupCreate) return;
        
        const envProvider = getProviderForEnvironment(providers, envKey);
        
        // State resource group for this environment
        const state = new azure.resources.ResourceGroup(`${config.resourceGroupStateName}-${envKey}`, {
            location: config.location,
        }, { provider: envProvider });

        // Identity resource group for this environment
        const identity = new azure.resources.ResourceGroup(`${config.resourceGroupIdentityName}-${envKey}`, {
            location: config.location,
        }, { provider: envProvider });

        // Optional agents resource group for this environment
        let agents: azure.resources.ResourceGroup | undefined;
        if (config.useSelfHostedAgents) {
            agents = new azure.resources.ResourceGroup(`${config.resourceGroupAgentsName}-${envKey}`, {
                location: config.location,
            }, { provider: envProvider });
        }

        // Workload resource group for this environment (where user resources go)
        const workload = new azure.resources.ResourceGroup(`${config.resourceNameWorkload}-${envKey}-${config.location}`, {
            location: config.location,
        }, { provider: envProvider });

        environments[envKey] = {
            identity,
            agents,
            workload,
        };
    });

    return {
        environments,
    };
}
