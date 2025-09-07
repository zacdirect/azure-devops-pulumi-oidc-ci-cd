import * as pulumi from "@pulumi/pulumi";
import { getConfigValue } from "./layered-config";


export interface SubnetsAndSizes {
    agents: number;
    private_endpoints: number;
}

export interface ResourceNameTemplates {
    resourceGroupStateName: string;
    resourceGroupAgentsName: string;
    resourceGroupIdentityName: string;
    virtualNetworkName: string;
    networkSecurityGroupName: string;
    natGatewayName: string;
    natGatewayPublicIpName: string;
    storageAccountName: string;
    storageAccountPrivateEndpointName: string;
    agentComputePostfixName: string;
    containerInstancePrefixName: string;
    containerRegistryName: string;
    projectName: string;
    repositoryMainName: string;
    repositoryTemplateName: string;
    agentPoolName: string;
    groupName: string;
}

export interface EnvironmentConfig {
    displayOrder: number;
    displayName: string;
    hasApproval?: boolean;
    dependentEnvironment?: string;
    resourceGroupCreate?: boolean;
    resourceGroupNameTemplate?: string;
    userAssignedManagedIdentityNameTemplate?: string;
}

export interface Environments {
    dev: EnvironmentConfig;
    test: EnvironmentConfig;
    prod: EnvironmentConfig;
}



export interface ProjectConfigInit {
    versionControlSystemType?: string;
    versionControlSystemPersonalAccessToken?: string;
    versionControlSystemOrganization?: string;
    versionControlSystemPoolName?: string;
    location?: string;
    organizationName?: string;
    personalAccessToken?: string;
    azureDevopsProject?: string;
    azureDevopsCreateProject?: boolean;
    useSelfHostedAgents?: boolean;
    selfHostedAgentType?: string;
    addressSpace?: string;
    subnetsAndSizes?: SubnetsAndSizes;
    approvers?: Record<string, string>;
    exampleModulePath?: string;
    repositoryPostfix?: string;
    repositoryPostfixTemplate?: string;
    agentUseAvailabilityZones?: boolean;
    resourceNameLocationShort?: string;
    resourceNameWorkload?: string;
    resourceNameEnvironment?: string;
    resourceNameSequenceStart?: number;
    environments?: Environments;
    organizationNamePrefix?: string;
    versionControlSystemAuthenticationMethod?: string;
    versionControlSystemGithubApplicationId?: string;
    versionControlSystemGithubApplicationInstallationId?: string;
    versionControlSystemGithubApplicationKey?: string;
}

export class ProjectConfig extends pulumi.Config {
    public readonly versionControlSystemType: string;
    public readonly versionControlSystemPersonalAccessToken: string;
    public readonly versionControlSystemOrganization: string;
    public readonly versionControlSystemPoolName: string;
    public readonly location: string;
    public readonly organizationName: string;
    public readonly personalAccessToken: string;
    public readonly azureDevopsProject: string;
    public readonly azureDevopsCreateProject: boolean;
    public readonly useSelfHostedAgents: boolean;
    public readonly selfHostedAgentType: string;
    public readonly addressSpace: string;
    public readonly subnetsAndSizes: SubnetsAndSizes;
    public readonly approvers: Record<string, string>;
    public readonly exampleModulePath: string;
    public readonly repositoryPostfix: string;
    public readonly repositoryPostfixTemplate: string;
    public readonly agentUseAvailabilityZones: boolean;
    public readonly resourceNameLocationShort: string;
    public readonly resourceNameWorkload: string;
    public readonly resourceNameEnvironment: string;
    public readonly resourceNameSequenceStart: number;
    public readonly resourceGroupStateName: string;
    public readonly resourceGroupAgentsName: string;
    public readonly resourceGroupIdentityName: string;
    public readonly virtualNetworkName: string;
    public readonly networkSecurityGroupName: string;
    public readonly natGatewayName: string;
    public readonly natGatewayPublicIpName: string;
    public readonly storageAccountName: string;
    public readonly storageAccountPrivateEndpointName: string;
    public readonly agentComputePostfixName: string;
    public readonly containerInstancePrefixName: string;
    public readonly containerRegistryName: string;
    public readonly projectName: string;
    public readonly repositoryMainName: string;
    public readonly repositoryTemplateName: string;
    public readonly agentPoolName: string;
    public readonly groupName: string;
    public readonly environments: Environments;
    public readonly organizationNamePrefix: string;
    public readonly versionControlSystemAuthenticationMethod: string;
    public readonly versionControlSystemGithubApplicationId: string;
    public readonly versionControlSystemGithubApplicationInstallationId: string;
    public readonly versionControlSystemGithubApplicationKey: string;

    constructor(init?: ProjectConfigInit) {
        super('azure-devops-pulumi-oidc-ci-cd');
        // Helper for layered config
        const layered = <T>(key: string, def: T): T => getConfigValue<T>(this, key, init as Record<string, unknown>, def);

        this.versionControlSystemType = layered('versionControlSystemType', 'azuredevops');
        this.versionControlSystemPersonalAccessToken = layered('versionControlSystemPersonalAccessToken', process.env['AZDO_PERSONAL_ACCESS_TOKEN'] || '');
        this.versionControlSystemOrganization = layered('versionControlSystemOrganization', 'https://dev.azure.com/zacharycook/');
        this.versionControlSystemPoolName = layered('versionControlSystemPoolName', 'pulumi_should_create_this_pool_name');
        this.location = layered('location', 'northcentralus');
        this.organizationName = layered('organizationName', 'zacharycook/');
        this.personalAccessToken = layered('personalAccessToken', process.env['AZDO_PERSONAL_ACCESS_TOKEN'] || '');
        this.azureDevopsProject = layered('azureDevopsProject', 'ZacDirect');
        this.azureDevopsCreateProject = layered('azureDevopsCreateProject', false);
        this.useSelfHostedAgents = layered('useSelfHostedAgents', true);
        this.selfHostedAgentType = layered('selfHostedAgentType', 'azure_container_instance');
        this.addressSpace = layered('addressSpace', '10.0.10.0/24');
        this.subnetsAndSizes = layered('subnetsAndSizes', { agents: 27, private_endpoints: 29 });
        this.approvers = layered('approvers', {});
        this.exampleModulePath = layered('exampleModulePath', '../zac-direct-modules');
        this.repositoryPostfix = layered('repositoryPostfix', 'zacdirect');
        this.repositoryPostfixTemplate = layered('repositoryPostfixTemplate', 'zac-direct-template');
        this.agentUseAvailabilityZones = layered('agentUseAvailabilityZones', false);
        this.resourceNameLocationShort = layered('resourceNameLocationShort', '');
        this.resourceNameWorkload = layered('resourceNameWorkload', 'dema');
        this.resourceNameEnvironment = layered('resourceNameEnvironment', 'mgt');
        this.resourceNameSequenceStart = layered('resourceNameSequenceStart', 1);

        // Compute all template properties at construction
        const replacements = {
            workload: this.resourceNameWorkload,
            environment: this.resourceNameEnvironment,
            location: this.location,
            locationShort: this.resourceNameLocationShort,
            sequence: String(this.resourceNameSequenceStart).padStart(3, '0'),
        };
        this.resourceGroupStateName = layered('resourceGroupStateName', `rg-${replacements.workload}-state-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.resourceGroupAgentsName = layered('resourceGroupAgentsName', `rg-${replacements.workload}-agents-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.resourceGroupIdentityName = layered('resourceGroupIdentityName', `rg-${replacements.workload}-identity-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.virtualNetworkName = layered('virtualNetworkName', `vnet-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.networkSecurityGroupName = layered('networkSecurityGroupName', `nsg-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.natGatewayName = layered('natGatewayName', `nat-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.natGatewayPublicIpName = layered('natGatewayPublicIpName', `pip-nat-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.storageAccountName = layered('storageAccountName', `sto${replacements.workload}${replacements.environment}${replacements.locationShort}${replacements.sequence}`);
        this.storageAccountPrivateEndpointName = layered('storageAccountPrivateEndpointName', `pe-sto-${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.agentComputePostfixName = layered('agentComputePostfixName', `${replacements.workload}-${replacements.environment}-${replacements.location}-${replacements.sequence}`);
        this.containerInstancePrefixName = layered('containerInstancePrefixName', `aci-${replacements.workload}-${replacements.environment}-${replacements.location}`);
        this.containerRegistryName = layered('containerRegistryName', `acr${replacements.workload}${replacements.environment}${replacements.location}${replacements.sequence}`);
        this.projectName = layered('projectName', `${replacements.workload}-${replacements.environment}`);
        this.repositoryMainName = layered('repositoryMainName', `${replacements.workload}-${replacements.environment}-main`);
        this.repositoryTemplateName = layered('repositoryTemplateName', `${replacements.workload}-${replacements.environment}-template`);
        this.agentPoolName = layered('agentPoolName', `agent-pool-${replacements.workload}-${replacements.environment}`);
        this.groupName = layered('groupName', `group-${replacements.workload}-${replacements.environment}-approvers`);

        this.environments = layered('environments', {
            dev: { displayOrder: 1, displayName: 'Development' },
            test: { displayOrder: 2, displayName: 'Test', dependentEnvironment: 'dev' },
            prod: { displayOrder: 3, displayName: 'Production', hasApproval: true, dependentEnvironment: 'test' }
        });
        this.organizationNamePrefix = layered('organizationNamePrefix', 'https://dev.azure.com');
        this.versionControlSystemAuthenticationMethod = layered('versionControlSystemAuthenticationMethod', 'pat');
        this.versionControlSystemGithubApplicationId = layered('versionControlSystemGithubApplicationId', '');
        this.versionControlSystemGithubApplicationInstallationId = layered('versionControlSystemGithubApplicationInstallationId', '');
        this.versionControlSystemGithubApplicationKey = layered('versionControlSystemGithubApplicationKey', '');
    }
}
