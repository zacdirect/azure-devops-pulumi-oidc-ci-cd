import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface AgentPoolsResult {
    agentPool?: azuredevops.Pool;
    agentQueue?: azuredevops.Queue;
    agentPoolName: pulumi.Output<string>;
}

export function createAgentPools(
    config: ProjectConfig,
    projectId: pulumi.Input<string>
): AgentPoolsResult {
    if (!config.useSelfHostedAgents) {
        return {
            agentPoolName: pulumi.output("ubuntu-latest"),
        };
    }

    const agentPool = new azuredevops.Pool(config.agentPoolName, {
        name: config.agentPoolName,
        autoProvision: false,
        autoUpdate: true,
    });

    const agentQueue = new azuredevops.Queue(`${config.agentPoolName}-queue`, {
        projectId: projectId,
        agentPoolId: agentPool.id.apply(id => { return Number(id);}),
    });

    return {
        agentPool,
        agentQueue,
        agentPoolName: agentPool.name,
    };
}
