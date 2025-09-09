import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface AzureDevOpsProviderResult {
    provider: azuredevops.Provider;
}

/**
 * Create Azure DevOps provider with organization configuration.
 * Azure DevOps resources operate at the organization level and don't require environment isolation.
 */
export function createAzureDevOpsProvider(config: ProjectConfig): AzureDevOpsProviderResult {
    // Clean up organization name by removing trailing slash if present
    const cleanOrgName = config.organizationName.replace(/\/$/, '');
    
    // Construct the full organization URL
    const orgUrl = `${config.organizationNamePrefix}/${cleanOrgName}`;
    
    // Resolve PAT from environment variables or config
    // Common environment variables: AZDO_PERSONAL_ACCESS_TOKEN, AZURE_DEVOPS_EXT_PAT, AZDO_PAT
    const patFromEnv = process.env.AZDO_PERSONAL_ACCESS_TOKEN || 
                       process.env.AZURE_DEVOPS_EXT_PAT || 
                       process.env.AZDO_PAT;
    
    const finalPat = patFromEnv || config.personalAccessToken;
    
    // Log what we're using (without exposing the actual token)
    if (patFromEnv) {
        pulumi.log.debug("Using Azure DevOps PAT from environment variable");
    } else if (config.personalAccessToken && config.personalAccessToken !== "todo") {
        pulumi.log.debug("Using Azure DevOps PAT from Pulumi configuration");
    } else {
        pulumi.log.warn("Azure DevOps PAT not found in environment variables or valid configuration. Set AZDO_PERSONAL_ACCESS_TOKEN environment variable or configure personalAccessToken.");
    }
    
    pulumi.log.debug(`Azure DevOps provider connecting to: ${orgUrl}`);
    
    const provider = new azuredevops.Provider("azuredevops", {
        orgServiceUrl: orgUrl,
        personalAccessToken: finalPat,
    });

    return {
        provider,
    };
}
