import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

export interface ExtendedAzureProviderArgs extends azure.ProviderArgs {
    subscriptionName: pulumi.Input<string>;
}

/**
 * Extended Azure Provider that includes additional Azure context properties
 */
export class ExtendedAzureProvider extends azure.Provider {
    public readonly subscriptionName: pulumi.Output<string>;
    public readonly subscriptionId: pulumi.Output<string>;
    public readonly tenantId: pulumi.Output<string>;

    constructor(name: string, args: ExtendedAzureProviderArgs, opts?: pulumi.ResourceOptions) {
        super(name, args, opts);
        
        // Convert inputs to outputs and validate resolved values
        this.subscriptionId = pulumi.output(args.subscriptionId).apply(value => {
            if (!value || value.trim() === '') {
                throw new Error(`subscriptionId is required for Azure provider '${name}'. Check your provider configuration.`);
            }
            return value;
        });
        
        this.tenantId = pulumi.output(args.tenantId).apply(value => {
            if (!value || value.trim() === '') {
                throw new Error(`tenantId is required for Azure provider '${name}'. Check your provider configuration.`);
            }
            return value;
        });
        
        this.subscriptionName = pulumi.output(args.subscriptionName).apply(value => {
            if (!value || value.trim() === '') {
                throw new Error(`subscriptionName is required for Azure provider '${name}'. Check your provider configuration.`);
            }
            return value;
        });
    }
}
