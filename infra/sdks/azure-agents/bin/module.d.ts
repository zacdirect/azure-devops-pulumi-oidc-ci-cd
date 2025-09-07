import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
export declare class Module extends pulumi.CustomResource {
    /**
     * Get an existing Module resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Module;
    /**
     * Returns true if the given object is an instance of Module.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Module;
    /**
     * The subnet id of the container app job.
     */
    readonly container_app_subnet_resource_id: pulumi.Output<any | undefined>;
    /**
     * The names of the container instances.
     */
    readonly container_instance_names: pulumi.Output<string[] | undefined>;
    /**
     * The resource ids of the container instances.
     */
    readonly container_instance_resource_ids: pulumi.Output<string[] | undefined>;
    /**
     * The container registry login server.
     */
    readonly container_registry_login_server: pulumi.Output<any | undefined>;
    /**
     * The container registry name.
     */
    readonly container_registry_name: pulumi.Output<any | undefined>;
    /**
     * The container registry resource id.
     */
    readonly container_registry_resource_id: pulumi.Output<any | undefined>;
    /**
     * The name of the container app job.
     */
    readonly job_name: pulumi.Output<any | undefined>;
    /**
     * The resource id of the container app job.
     */
    readonly job_resource_id: pulumi.Output<any | undefined>;
    /**
     * The name of the container app environment.
     */
    readonly name: pulumi.Output<any | undefined>;
    /**
     * The name of the placeholder contaienr app job.
     */
    readonly placeholder_job_name: pulumi.Output<any | undefined>;
    /**
     * The resource id of the placeholder container app job.
     */
    readonly placeholder_job_resource_id: pulumi.Output<any | undefined>;
    /**
     * The private dns zone id of the container registry.
     */
    readonly private_dns_zone_subnet_resource_id: pulumi.Output<any | undefined>;
    /**
     * The resource id of the container app environment.
     */
    readonly resource_id: pulumi.Output<any | undefined>;
    /**
     * The resource id of the user assigned managed identity.
     */
    readonly user_assigned_managed_identity_id: pulumi.Output<any | undefined>;
    /**
     * The principal id of the user assigned managed identity.
     */
    readonly user_assigned_managed_identity_principal_id: pulumi.Output<any | undefined>;
    /**
     * The virtual network name.
     */
    readonly virtual_network_name: pulumi.Output<any | undefined>;
    /**
     * The virtual network resource id.
     */
    readonly virtual_network_resource_id: pulumi.Output<any | undefined>;
    /**
     * Create a Module resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ModuleArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * The set of arguments for constructing a Module resource.
 */
export interface ModuleArgs {
    /**
     * The types of compute to use. Allowed values are 'azure_container_app' and 'azure_container_instance'.
     */
    compute_types?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Required CPU in cores, e.g. 0.5
     */
    container_app_container_cpu?: pulumi.Input<number>;
    /**
     * Required memory, e.g. '250Mb'
     */
    container_app_container_memory?: pulumi.Input<string>;
    /**
     * Whether or not to create a Container App Environment.
     */
    container_app_environment_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The resource id of the Container App Environment. Only required if `container_app_environment_creation_enabled` is `false`.
     */
    container_app_environment_id?: pulumi.Input<string>;
    /**
     * The name of the Container App Environment. Only required if `container_app_environment_creation_enabled` is `true`.
     */
    container_app_environment_name?: pulumi.Input<string>;
    /**
     * List of additional environment variables to pass to the container.
     */
    container_app_environment_variables?: pulumi.Input<pulumi.Input<inputs.ContainerAppEnvironmentVariablesArgs>[]>;
    /**
     * The name of the resource group where the Container Apps infrastructure is deployed.
     */
    container_app_infrastructure_resource_group_name?: pulumi.Input<string>;
    /**
     * The name of the container for the runner Container Apps job.
     */
    container_app_job_container_name?: pulumi.Input<string>;
    /**
     * The name of the Container App runner job.
     */
    container_app_job_name?: pulumi.Input<string>;
    /**
     * The maximum number of executions (ADO jobs) to spawn per polling interval.
     */
    container_app_max_execution_count?: pulumi.Input<number>;
    /**
     * The minimum number of executions (ADO jobs) to spawn per polling interval.
     */
    container_app_min_execution_count?: pulumi.Input<number>;
    /**
     * The name of the container for the placeholder Container Apps job.
     */
    container_app_placeholder_container_name?: pulumi.Input<string>;
    /**
     * The name of the Container App placeholder job.
     */
    container_app_placeholder_job_name?: pulumi.Input<string>;
    /**
     * The number of times to retry the placeholder Container Apps job.
     */
    container_app_placeholder_replica_retry_limit?: pulumi.Input<number>;
    /**
     * The timeout in seconds for the placeholder Container Apps job.
     */
    container_app_placeholder_replica_timeout?: pulumi.Input<number>;
    /**
     * How often should the pipeline queue be checked for new events, in seconds.
     */
    container_app_polling_interval_seconds?: pulumi.Input<number>;
    /**
     * The number of times to retry the runner Container Apps job.
     */
    container_app_replica_retry_limit?: pulumi.Input<number>;
    /**
     * The timeout in seconds for the runner Container Apps job.
     */
    container_app_replica_timeout?: pulumi.Input<number>;
    /**
     * List of additional sensitive environment variables to pass to the container.
     */
    container_app_sensitive_environment_variables?: pulumi.Input<pulumi.Input<inputs.ContainerAppSensitiveEnvironmentVariablesArgs>[]>;
    /**
     * The address prefix for the Container App Environment. Either subnet_id or subnet_name and subnet_address_prefix must be specified.
     */
    container_app_subnet_address_prefix?: pulumi.Input<string>;
    /**
     * The CIDR size for the container instance subnet.
     */
    container_app_subnet_cidr_size?: pulumi.Input<number>;
    /**
     * The ID of a pre-existing subnet to use. Required if `virtual_network_creation_enabled` is `false`.
     */
    container_app_subnet_id?: pulumi.Input<string>;
    /**
     * The name of the subnet. Must be specified if `virtual_network_creation_enabled` is `true`.
     */
    container_app_subnet_name?: pulumi.Input<string>;
    /**
     * The CPU value for the container instance
     */
    container_instance_container_cpu?: pulumi.Input<number>;
    /**
     * The CPU limit value for the container instance
     */
    container_instance_container_cpu_limit?: pulumi.Input<number>;
    /**
     * The memory value for the container instance
     */
    container_instance_container_memory?: pulumi.Input<number>;
    /**
     * The memory limit value for the container instance
     */
    container_instance_container_memory_limit?: pulumi.Input<number>;
    /**
     * The name of the container instance
     */
    container_instance_container_name?: pulumi.Input<string>;
    /**
     * The number of container instances to create
     */
    container_instance_count?: pulumi.Input<number>;
    /**
     * List of additional environment variables to pass to the container.
     */
    container_instance_environment_variables?: pulumi.Input<pulumi.Input<inputs.ContainerInstanceEnvironmentVariablesArgs>[]>;
    /**
     * The name prefix of the container instance
     */
    container_instance_name_prefix?: pulumi.Input<string>;
    /**
     * List of additional sensitive environment variables to pass to the container.
     */
    container_instance_sensitive_environment_variables?: pulumi.Input<pulumi.Input<inputs.ContainerInstanceSensitiveEnvironmentVariablesArgs>[]>;
    /**
     * The address prefix for the Container App Environment. Either subnet_id or subnet_name and subnet_address_prefix must be specified.
     */
    container_instance_subnet_address_prefix?: pulumi.Input<string>;
    /**
     * The CIDR size for the container instance subnet.
     */
    container_instance_subnet_cidr_size?: pulumi.Input<number>;
    /**
     * The ID of a pre-existing subnet to use. Required if `virtual_network_creation_enabled` is `false`.
     */
    container_instance_subnet_id?: pulumi.Input<string>;
    /**
     * The name of the subnet. Must be specified if `virtual_network_creation_enabled == false`.
     */
    container_instance_subnet_name?: pulumi.Input<string>;
    /**
     * Whether to use availability zones for the container instance
     */
    container_instance_use_availability_zones?: pulumi.Input<boolean>;
    /**
     * Whether or not to create a container registry.
     */
    container_registry_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The ID of the private DNS zone to create for the container registry. Only required if `container_registry_private_dns_zone_creation_enabled` is `false` and you are not using policy to update the DNS zone.
     */
    container_registry_dns_zone_id?: pulumi.Input<string>;
    /**
     * The name of the container registry. Only required if `container_registry_creation_enabled` is `true`.
     */
    container_registry_name?: pulumi.Input<string>;
    /**
     * Whether or not to create a private DNS zone for the container registry.
     */
    container_registry_private_dns_zone_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The address prefix for the Container App Environment. Either subnet_id or subnet_name and subnet_address_prefix must be specified.
     */
    container_registry_private_endpoint_subnet_address_prefix?: pulumi.Input<string>;
    /**
     * The ID of a pre-existing subnet to use. Required if `virtual_network_creation_enabled` is `false`.
     */
    container_registry_private_endpoint_subnet_id?: pulumi.Input<string>;
    /**
     * The name of the subnet. Must be specified if `virtual_network_creation_enabled == false`.
     */
    container_registry_private_endpoint_subnet_name?: pulumi.Input<string>;
    /**
     * The CIDR size for the container registry subnet.
     */
    container_registry_subnet_cidr_size?: pulumi.Input<number>;
    /**
     * The images to build and push to the container registry. This is only relevant if `container_registry_creation_enabled` is `true` and `use_default_container_image` is set to `false`.
     *
     * - task_name: The name of the task to create for building the image (e.g. `image-build-task`)
     * - dockerfile_path: The path to the Dockerfile to use for building the image (e.g. `dockerfile`)
     * - context_path: The path to the context of the Dockerfile in three sections `<repository-url>#<repository-commit>:<repository-folder-path>` (e.g. https://github.com/Azure/avm-container-images-cicd-agents-and-runners#bc4087f:azure-devops-agent)
     * - context_access_token: The access token to use for accessing the context. Supply a PAT if targetting a private repository.
     * - image_names: A list of the names of the images to build (e.g. `["image-name:tag"]`)
     */
    custom_container_registry_images?: pulumi.Input<{
        [key: string]: pulumi.Input<inputs.CustomContainerRegistryImagesArgs>;
    }>;
    /**
     * The login server of the container registry to use if `container_registry_creation_enabled` is `false`.
     */
    custom_container_registry_login_server?: pulumi.Input<string>;
    /**
     * The password of the container registry to use if `container_registry_creation_enabled` is `false`.
     */
    custom_container_registry_password?: pulumi.Input<string>;
    /**
     * The username of the container registry to use if `container_registry_creation_enabled` is `false`.
     */
    custom_container_registry_username?: pulumi.Input<string>;
    /**
     * The default image name to use if no custom image is provided.
     */
    default_image_name?: pulumi.Input<string>;
    /**
     * The default image registry Dockerfile path to use if no custom image is provided.
     */
    default_image_registry_dockerfile_path?: pulumi.Input<string>;
    /**
     * The default image repository commit to use if no custom image is provided.
     */
    default_image_repository_commit?: pulumi.Input<string>;
    /**
     * The default image repository folder path to use if no custom image is provided.
     */
    default_image_repository_folder_paths?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * The default image repository URL to use if no custom image is provided.
     */
    default_image_repository_url?: pulumi.Input<string>;
    /**
     * Delays (in seconds) to apply to the module operations.
     */
    delays?: pulumi.Input<inputs.DelaysArgs>;
    /**
     * This variable controls whether or not telemetry is enabled for the module.
     * For more information see <https://aka.ms/avm/telemetryinfo>.
     * If it is set to false, then no telemetry will be collected.
     */
    enable_telemetry?: pulumi.Input<boolean>;
    /**
     * Azure region where the resource should be deployed.
     */
    location: pulumi.Input<string>;
    /**
     *   Controls the Resource Lock configuration for this resource. The following properties can be specified:
     *
     *   - `kind` - (Required) The type of lock. Possible values are `\"CanNotDelete\"` and `\"ReadOnly\"`.
     *   - `name` - (Optional) The name of the lock. If not specified, a name will be generated based on the `kind` value. Changing this forces the creation of a new resource.
     */
    lock?: pulumi.Input<inputs.LockArgs>;
    /**
     * Whether or not to create a log analytics workspace.
     */
    log_analytics_workspace_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The resource Id of the Log Analytics Workspace.
     */
    log_analytics_workspace_id?: pulumi.Input<string>;
    /**
     * The name of the log analytics workspace. Only required if `log_analytics_workspace_creation_enabled == false`.
     */
    log_analytics_workspace_name?: pulumi.Input<string>;
    /**
     * The retention period for the Log Analytics Workspace.
     */
    log_analytics_workspace_retention_in_days?: pulumi.Input<number>;
    /**
     * The SKU of the Log Analytics Workspace.
     */
    log_analytics_workspace_sku?: pulumi.Input<string>;
    /**
     * Whether or not to create a NAT Gateway.
     */
    nat_gateway_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The ID of the NAT Gateway. Only required if `nat_gateway_creation_enabled` is `false`.
     */
    nat_gateway_id?: pulumi.Input<string>;
    /**
     * The name of the NAT Gateway.
     */
    nat_gateway_name?: pulumi.Input<string>;
    /**
     * A postfix used to build default names if no name has been supplied for a specific resource type.
     */
    postfix: pulumi.Input<string>;
    /**
     * Whether or not to create a public IP.
     */
    public_ip_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The ID of the public IP. Only required if `public_ip_creation_enabled` is `false`.
     */
    public_ip_id?: pulumi.Input<string>;
    /**
     * The name of the public IP.
     */
    public_ip_name?: pulumi.Input<string>;
    /**
     * The availability zones for the public IP. Only required if `public_ip_creation_enabled` is `true`.
     */
    public_ip_zones?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Whether or not to create a resource group.
     */
    resource_group_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The resource group where the resources will be deployed. Must be specified if `resource_group_creation_enabled == false`
     */
    resource_group_name?: pulumi.Input<string>;
    /**
     * (Optional) Tags of the resource.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Whether or not to use the default container image provided by the module.
     */
    use_default_container_image?: pulumi.Input<boolean>;
    /**
     * Whether or not to use private networking for the container registry.
     */
    use_private_networking?: pulumi.Input<boolean>;
    /**
     * Whether or not to create a user assigned managed identity.
     */
    user_assigned_managed_identity_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The resource Id of the user assigned managed identity. Only required if `user_assigned_managed_identity_creation_enabled == false`.
     */
    user_assigned_managed_identity_id?: pulumi.Input<string>;
    /**
     * The name of the user assigned managed identity. Must be specified if `user_assigned_managed_identity_creation_enabled == true`.
     */
    user_assigned_managed_identity_name?: pulumi.Input<string>;
    /**
     * The principal id of the user assigned managed identity. Only required if `user_assigned_managed_identity_creation_enabled == false`.
     */
    user_assigned_managed_identity_principal_id?: pulumi.Input<string>;
    /**
     * The version control system agent name prefix.
     */
    version_control_system_agent_name_prefix?: pulumi.Input<string>;
    /**
     * The target value for the amound of pending jobs to scale on.
     */
    version_control_system_agent_target_queue_length?: pulumi.Input<number>;
    /**
     * GitHub authentication method. Possible values: pat or github_app
     */
    version_control_system_authentication_method?: pulumi.Input<string>;
    /**
     * The enterprise name for the version control system.
     */
    version_control_system_enterprise?: pulumi.Input<string>;
    /**
     * The application ID for the GitHub App authentication method.
     */
    version_control_system_github_application_id?: pulumi.Input<string>;
    /**
     * The installation ID for the GitHub App authentication method.
     */
    version_control_system_github_application_installation_id?: pulumi.Input<string>;
    /**
     * The application key for the GitHub App authentication method.
     */
    version_control_system_github_application_key?: pulumi.Input<string>;
    /**
     * The version control system organization to deploy the agents too.
     */
    version_control_system_organization: pulumi.Input<string>;
    /**
     * The personal access token for the version control system.
     */
    version_control_system_personal_access_token?: pulumi.Input<string>;
    /**
     * The version control system placeholder agent name.
     */
    version_control_system_placeholder_agent_name?: pulumi.Input<string>;
    /**
     * The name of the agent pool in the version control system.
     */
    version_control_system_pool_name?: pulumi.Input<string>;
    /**
     * The version control system repository to deploy the agents too.
     */
    version_control_system_repository?: pulumi.Input<string>;
    /**
     * The runner group to add the runner to.
     */
    version_control_system_runner_group?: pulumi.Input<string>;
    /**
     * The scope of the runner. Must be `ent`, `org`, or `repo`. This is ignored for Azure DevOps.
     */
    version_control_system_runner_scope?: pulumi.Input<string>;
    /**
     * The type of the version control system to deploy the agents too. Allowed values are 'azuredevops' or 'github'
     */
    version_control_system_type: pulumi.Input<string>;
    /**
     * The address space for the virtual network. Must be specified if `virtual_network_creation_enabled` is `true`.
     */
    virtual_network_address_space?: pulumi.Input<string>;
    /**
     * Whether or not to create a virtual network.
     */
    virtual_network_creation_enabled?: pulumi.Input<boolean>;
    /**
     * The ID of the virtual network. Only required if `virtual_network_creation_enabled` is `false`.
     */
    virtual_network_id?: pulumi.Input<string>;
    /**
     * The name of the virtual network. Must be specified if `virtual_network_creation_enabled` is `true`.
     */
    virtual_network_name?: pulumi.Input<string>;
}
