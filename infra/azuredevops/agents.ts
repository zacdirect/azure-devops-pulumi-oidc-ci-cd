import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface AgentPoolsResult {
    agentPools: Record<string, azuredevops.Pool>;
    agentQueues: Record<string, azuredevops.Queue>;
    poolNames: Record<string, pulumi.Output<string>>;
}

export function createAgentPools(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    azureDevOpsProvider?: azuredevops.Provider
): AgentPoolsResult {
    const agentPools: Record<string, azuredevops.Pool> = {};
    const agentQueues: Record<string, azuredevops.Queue> = {};
    const poolNames: Record<string, pulumi.Output<string>> = {};

    if (!config.useSelfHostedAgents) {
        // For environments not using self-hosted agents, use hosted agents
        Object.keys(config.environments).forEach(envKey => {
            poolNames[envKey] = pulumi.output("ubuntu-latest");
        });
        return {
            agentPools,
            agentQueues,
            poolNames,
        };
    }

    // Create agent pools per environment
    Object.keys(config.environments).forEach(envKey => {
        const agentPool = new azuredevops.Pool(`${envKey}-agent-pool`, {
            name: `${config.agentPoolName}-${envKey}`,
            autoProvision: false,
            autoUpdate: true,
        }, { provider: azureDevOpsProvider });

        const agentQueue = new azuredevops.Queue(`${envKey}-agent-queue`, {
            projectId: projectId,
            agentPoolId: agentPool.id.apply(id => Number(id)),
        }, { provider: azureDevOpsProvider });

        agentPools[envKey] = agentPool;
        agentQueues[envKey] = agentQueue;
        poolNames[envKey] = agentPool.name;
    });

    return {
        agentPools,
        agentQueues,
        poolNames,
    };
}
