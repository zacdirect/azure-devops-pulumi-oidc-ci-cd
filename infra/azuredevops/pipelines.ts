import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";
import { RepositoriesResult } from "./repositories";
import { EnvironmentsResult } from "./environments";
import { ServiceConnectionsResult } from "./service-connections";
import { AgentPoolsResult } from "./agents";

export interface PipelinesResult {
    buildDefinitions: Record<string, azuredevops.BuildDefinition>;
    serviceConnectionAuthorizations: azuredevops.PipelineAuthorization[];
    environmentAuthorizations: azuredevops.PipelineAuthorization[];
    agentPoolAuthorizations: azuredevops.PipelineAuthorization[];
}

export function createPipelines(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    repositories: RepositoriesResult,
    environments: EnvironmentsResult,
    serviceConnections: ServiceConnectionsResult,
    agentPools: AgentPoolsResult
): PipelinesResult {
    // Define pipeline configurations
    const pipelineConfigs = {
        ci: {
            name: "01 - Continuous Integration",
            filePath: "ci.yaml",
        },
        cd: {
            name: "02 - Continuous Delivery", 
            filePath: "cd.yaml",
        },
    };

    // Create build definitions
    const buildDefinitions: Record<string, azuredevops.BuildDefinition> = {};
    
    Object.entries(pipelineConfigs).forEach(([pipelineKey, pipelineConfig]) => {
        const buildDefinition = new azuredevops.BuildDefinition(`build-definition-${pipelineKey}`, {
            projectId: projectId,
            name: pipelineConfig.name,
            ciTrigger: {
                useYaml: true,
            },
            repository: {
                repoType: "TfsGit",
                repoId: repositories.mainRepository.id,
                branchName: repositories.mainRepository.defaultBranch,
                ymlPath: pipelineConfig.filePath,
            },
        });

        buildDefinitions[pipelineKey] = buildDefinition;
    });

    // Create authorizations
    const serviceConnectionAuthorizations: azuredevops.PipelineAuthorization[] = [];
    const environmentAuthorizations: azuredevops.PipelineAuthorization[] = [];
    const agentPoolAuthorizations: azuredevops.PipelineAuthorization[] = [];

    // Service connection authorizations
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        ['plan', 'apply'].forEach(operation => {
            const connectionKey = `${envKey}-${operation}`;
            
            // For plan connections, both CI and CD pipelines need access
            // For apply connections, only CD pipeline needs access
            const pipelinesToAuthorize = operation === 'plan' ? ['ci', 'cd'] : ['cd'];
            
            pipelinesToAuthorize.forEach(pipelineKey => {
                if (serviceConnections.connections[connectionKey]) {
                    const auth = new azuredevops.PipelineAuthorization(`service-connection-auth-${connectionKey}-${pipelineKey}`, {
                        projectId: projectId,
                        resourceId: serviceConnections.connections[connectionKey].id,
                        type: "endpoint",
                        pipelineId: pulumi.output(buildDefinitions[pipelineKey].id).apply(id => parseInt(id)),
                    });
                    serviceConnectionAuthorizations.push(auth);
                }
            });
        });
    });

    // Environment authorizations
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        Object.entries(buildDefinitions).forEach(([pipelineKey, buildDefinition]) => {
            const auth = new azuredevops.PipelineAuthorization(`environment-auth-${envKey}-${pipelineKey}`, {
                projectId: projectId,
                resourceId: environments.environments[envKey].id,
                type: "environment",
                pipelineId: pulumi.output(buildDefinition.id).apply(id => parseInt(id)),
            });
            environmentAuthorizations.push(auth);
        });
    });

    // Agent pool authorizations (only if using self-hosted agents)
    if (config.useSelfHostedAgents && agentPools.agentQueue) {
        Object.entries(buildDefinitions).forEach(([pipelineKey, buildDefinition]) => {
            const auth = new azuredevops.PipelineAuthorization(`agent-pool-auth-${pipelineKey}`, {
                projectId: projectId,
                resourceId: agentPools.agentQueue!.id,
                type: "queue",
                pipelineId: pulumi.output(buildDefinition.id).apply(id => parseInt(id)),
            });
            agentPoolAuthorizations.push(auth);
        });
    }

    return {
        buildDefinitions,
        serviceConnectionAuthorizations,
        environmentAuthorizations,
        agentPoolAuthorizations,
    };
}
