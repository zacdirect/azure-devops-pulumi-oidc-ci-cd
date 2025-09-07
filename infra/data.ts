import * as azure from "@pulumi/azure-native";

// Get current Azure context (equivalent to data.azurerm_client_config.current)
export const current = azure.authorization.getClientConfigOutput();

// Get current subscription (equivalent to data.azurerm_subscription.current)
export const subscription = current.subscriptionId;
export const tenantId = current.tenantId;