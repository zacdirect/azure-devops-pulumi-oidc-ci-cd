import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface GroupsResult {
    approversGroup: azuredevops.Group;
    groupMembership?: azuredevops.GroupMembership;
}

export function createGroups(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    provider: azuredevops.Provider
): GroupsResult {
    // Create the approvers group
    const approversGroup = new azuredevops.Group("approvers-group", {
        scope: projectId,
        displayName: config.groupName,
        description: "Approvers for the Pulumi Up",
    }, { provider });

    // If approvers are configured, get their user data and add them to the group
    let groupMembership: azuredevops.GroupMembership | undefined;
    
    // Handle different ways approvers might be configured (undefined, empty object, string)
    let approversConfig: Record<string, string> = {};
    
    if (config.approvers === undefined || config.approvers === null) {
        // No approvers configured - this is valid
        approversConfig = {};
    } else if (typeof config.approvers === 'string') {
        // Handle case where YAML {} gets parsed as string "{}"
        const approversString = config.approvers as string;
        if (approversString === '{}' || approversString.trim() === '') {
            approversConfig = {};
        } else {
            throw new Error(`Invalid approvers configuration: got string '${approversString}'. Expected an object with user principal names or leave empty for no approvers.`);
        }
    } else if (typeof config.approvers === 'object') {
        // Normal case - approvers is an object
        approversConfig = config.approvers;
    } else {
        throw new Error(`Invalid approvers configuration: expected object, got ${typeof config.approvers}. Check your Pulumi configuration YAML syntax.`);
    }
    
    const approversEntries = Object.entries(approversConfig);
    
    // Validate each approver entry
    for (const [key, userPrincipalName] of approversEntries) {
        if (typeof userPrincipalName !== 'string' || userPrincipalName.trim() === '') {
            throw new Error(`Invalid approver configuration: key '${key}' has invalid value '${userPrincipalName}'. Expected a valid user principal name string.`);
        }
    }
    
    if (approversEntries.length > 0) {
        // Get user data for all approvers
        const userDataPromises = approversEntries.map(([key, userPrincipalName]) =>
            azuredevops.getUsersOutput({
                principalName: userPrincipalName,
            }, { provider }).apply(userData => {
                if (userData.users.length === 0) {
                    throw new Error(`No user account found for ${userPrincipalName}. Check that this is a valid user principal name in your Azure DevOps organization.`);
                }
                return userData.users.map(user => user.descriptor);
            })
        );

        // Wait for all user data and flatten the results
        const allUserDescriptors = pulumi.all(userDataPromises).apply(results => 
            results.flat()
        );

        // Create group membership
        groupMembership = new azuredevops.GroupMembership("approvers-group-membership", {
            group: approversGroup.descriptor,
            members: allUserDescriptors,
        }, { 
            provider,
            dependsOn: [approversGroup]
        });
    }

    return {
        approversGroup,
        groupMembership,
    };
}
