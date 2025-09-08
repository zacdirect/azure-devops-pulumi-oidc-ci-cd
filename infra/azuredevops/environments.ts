import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";
import { ProvidersResult } from "../azure/providers";

export interface AzureEnvironmentDetails {
    subscriptionId: pulumi.Output<string>;
    subscriptionName: pulumi.Output<string>;
    tenantId: pulumi.Output<string>;
    environmentName: string;
}

export interface EnvironmentsResult {
    environments: Record<string, azuredevops.Environment>;
    exclusiveLocks: Record<string, azuredevops.CheckExclusiveLock>;
    azureDetails: Record<string, AzureEnvironmentDetails>;
}

export function createEnvironments(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    providers: ProvidersResult
): EnvironmentsResult {
    const environments: Record<string, azuredevops.Environment> = {};
    const exclusiveLocks: Record<string, azuredevops.CheckExclusiveLock> = {};
    const azureDetails: Record<string, AzureEnvironmentDetails> = {};

    // Create environments for each configured environment
    Object.entries(config.environments).forEach(([envKey, envConfig]) => {
        // Get the Azure provider for this environment (1:1 relationship)
        const azureProvider = providers.environments[envKey];
        
        if (!azureProvider) {
            throw new Error(`No Azure provider found for environment '${envKey}'. Providers must match environment names.`);
        }

        // Extract Azure details from the provider - no config awareness needed
        azureDetails[envKey] = {
            subscriptionId: azureProvider.subscriptionId,
            subscriptionName: azureProvider.subscriptionName,
            tenantId: azureProvider.tenantId,
            environmentName: envKey,
        };

        // Create the environment with Azure provider details
        const environment = new azuredevops.Environment(`environment-${envKey}`, {
            name: envKey,
            projectId: projectId,
            description: pulumi.interpolate`${envConfig.displayName} - Azure Subscription: ${azureProvider.subscriptionName}`,
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
        azureDetails,
    };
}
