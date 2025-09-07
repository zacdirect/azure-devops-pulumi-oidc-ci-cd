import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface EnvironmentsResult {
    environments: Record<string, azuredevops.Environment>;
    exclusiveLocks: Record<string, azuredevops.CheckExclusiveLock>;
}

export function createEnvironments(
    config: ProjectConfig,
    projectId: pulumi.Input<string>
): EnvironmentsResult {
    const environments: Record<string, azuredevops.Environment> = {};
    const exclusiveLocks: Record<string, azuredevops.CheckExclusiveLock> = {};

    // Create environments for each configured environment
    Object.entries(config.environments).forEach(([envKey]) => {
        // Create the environment
        const environment = new azuredevops.Environment(`environment-${envKey}`, {
            name: envKey,
            projectId: projectId,
        });

        environments[envKey] = environment;

        // Create exclusive lock check for the environment
        const exclusiveLock = new azuredevops.CheckExclusiveLock(`environment-lock-${envKey}`, {
            projectId: projectId,
            targetResourceId: environment.id,
            targetResourceType: "environment",
            timeout: 43200, // 12 hours in seconds
        });

        exclusiveLocks[envKey] = exclusiveLock;
    });

    return {
        environments,
        exclusiveLocks,
    };
}
