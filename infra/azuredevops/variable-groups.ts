import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";
import { ResourceGroupsResult } from "../azure/resource-groups";
import { StorageResults } from "../azure/storage";

export interface VariableGroupsResult {
    variableGroups: Record<string, azuredevops.VariableGroup>;
}

export function createVariableGroups(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    resourceGroups: ResourceGroupsResult,
    storage: StorageResults
): VariableGroupsResult {
    const variableGroups: Record<string, azuredevops.VariableGroup> = {};

    // Create variable groups for each environment
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        const envResourceGroups = resourceGroups.environments[envKey];
        const envStorage = storage.environments[envKey];
        
        if (!envResourceGroups || !envStorage) return;

        const variableGroup = new azuredevops.VariableGroup(`variable-group-${envKey}`, {
            projectId: projectId,
            name: envKey,
            description: `Variable Group for ${envConfig.displayName}`,
            allowAccess: true,
            variables: [
                {
                    name: "ADDITIONAL_ENVIRONMENT_VARIABLES",
                    value: pulumi.jsonStringify({
                        TF_VAR_resource_group_name: envResourceGroups.workload.name,
                    }),
                },
                {
                    name: "VAR_FILE_PATH",
                    value: `./config/${envKey}.tfvars`,
                },
                {
                    name: "BACKEND_AZURE_STORAGE_ACCOUNT_NAME",
                    value: envStorage.artifactsStorage.name,
                },
                {
                    name: "BACKEND_AZURE_STORAGE_ACCOUNT_CONTAINER_NAME",
                    value: envKey,
                },
            ],
        });

        variableGroups[envKey] = variableGroup;
    });

    return {
        variableGroups,
    };
}
