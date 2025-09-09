import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

export interface ExtendedAzureProviderArgs {
    subscriptionId: string;
    tenantId: string;
    clientId?: string;
    clientSecret?: string;
    useOidc?: boolean;
    subscriptionName: string;
}

/**
 * Extended Azure Provider that includes additional Azure context properties
 */
export class ExtendedAzureProvider extends azure.Provider {
    public readonly subscriptionName: string;
    public readonly subscriptionId: string;
    public readonly tenantId: string;

    constructor(name: string, args: ExtendedAzureProviderArgs, opts?: pulumi.ResourceOptions) {
        super(name, args, opts);
        
        // Validate required values synchronously
        if (!args.subscriptionId || args.subscriptionId.trim() === '') {
            throw new Error(`subscriptionId is required for Azure provider '${name}'. Check your provider configuration.`);
        }
        if (!args.tenantId || args.tenantId.trim() === '') {
            throw new Error(`tenantId is required for Azure provider '${name}'. Check your provider configuration.`);
        }
        if (!args.subscriptionName || args.subscriptionName.trim() === '') {
            throw new Error(`subscriptionName is required for Azure provider '${name}'. Check your provider configuration.`);
        }
        
        this.subscriptionName = args.subscriptionName;
        this.subscriptionId = args.subscriptionId;
        this.tenantId = args.tenantId;
    }
}
