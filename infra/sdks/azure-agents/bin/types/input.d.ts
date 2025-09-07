import * as pulumi from "@pulumi/pulumi";
export interface ContainerAppEnvironmentVariablesArgs {
    name?: pulumi.Input<string>;
    value?: pulumi.Input<string>;
}
export interface ContainerAppSensitiveEnvironmentVariablesArgs {
    container_app_secret_name?: pulumi.Input<string>;
    keda_auth_name?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
    value?: pulumi.Input<string>;
}
export interface ContainerInstanceEnvironmentVariablesArgs {
    name?: pulumi.Input<string>;
    value?: pulumi.Input<string>;
}
export interface ContainerInstanceSensitiveEnvironmentVariablesArgs {
    name?: pulumi.Input<string>;
    value?: pulumi.Input<string>;
}
export interface CustomContainerRegistryImagesArgs {
    context_access_token?: pulumi.Input<string>;
    context_path?: pulumi.Input<string>;
    dockerfile_path?: pulumi.Input<string>;
    image_names?: pulumi.Input<pulumi.Input<string>[]>;
    task_name?: pulumi.Input<string>;
}
export interface DelaysArgs {
    delay_after_container_app_environment_creation?: pulumi.Input<number>;
    delay_after_container_image_build?: pulumi.Input<number>;
}
export interface LockArgs {
    kind?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
}
