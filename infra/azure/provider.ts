import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

export interface ExtendedAzureProviderArgs extends azure.ProviderArgs {
    subscriptionName: string;
}

/**
 * Extended Azure Provider that includes subscriptionName
 */
export class ExtendedAzureProvider extends azure.Provider {
    public readonly subscriptionName: string;

    constructor(name: string, args: ExtendedAzureProviderArgs, opts?: pulumi.ResourceOptions) {
        super(name, args, opts);
        
        this.subscriptionName = args.subscriptionName;
    }
}
