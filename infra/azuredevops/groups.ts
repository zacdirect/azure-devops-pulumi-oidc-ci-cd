import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface GroupsResult {
    approversGroup: azuredevops.Group;
    groupMembership?: azuredevops.GroupMembership;
}

export function createGroups(
    config: ProjectConfig,
    projectId: pulumi.Input<string>
): GroupsResult {
    // Create the approvers group
    const approversGroup = new azuredevops.Group("approvers-group", {
        scope: projectId,
        displayName: config.groupName,
        description: "Approvers for the Pulumi Up",
    });

    // If approvers are configured, get their user data and add them to the group
    let groupMembership: azuredevops.GroupMembership | undefined;
    
    if (Object.keys(config.approvers).length > 0) {
        // Get user data for all approvers
        const userDataPromises = Object.entries(config.approvers).map(([key, userPrincipalName]) =>
            azuredevops.getUsersOutput({
                principalName: userPrincipalName,
            }).apply(userData => {
                if (userData.users.length === 0) {
                    throw new Error(`No user account found for ${userPrincipalName}, check you have entered a valid user principal name...`);
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
        });
    }

    return {
        approversGroup,
        groupMembership,
    };
}
