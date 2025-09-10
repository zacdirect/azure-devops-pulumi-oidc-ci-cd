import * as azure from "@pulumi/azure";
import { ExtendedAzureProvider } from "./provider";

/**
 * A pair of Azure providers: the classic Azure provider (@pulumi/azure) and our ExtendedAzureProvider (@pulumi/azure-native).
 * The classic provider is needed for terraform modules, while the ExtendedAzureProvider is used for native Azure resources.
 */
export interface AzureProviderPair {
    /**
     * The classic Azure provider (@pulumi/azure) - has terraformConfig() method for terraform modules
     */
    classicProvider: azure.Provider;
    
    /**
     * Our extended Azure Native provider (@pulumi/azure-native) - used for native Azure resources
     */
    extendedProvider: ExtendedAzureProvider;
}
