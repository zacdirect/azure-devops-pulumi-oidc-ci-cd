import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";
import { EnvironmentsResult } from "./environments";

export interface RepositoriesResult {
    mainRepository: azuredevops.Git;
    templateRepository: azuredevops.Git;
    branchPolicies: {
        main: {
            minReviewers?: azuredevops.BranchPolicyMinReviewers;
            mergeTypes: azuredevops.BranchPolicyMergeTypes;
            buildValidation?: azuredevops.BranchPolicyBuildValidation;
        };
        template: {
            minReviewers?: azuredevops.BranchPolicyMinReviewers;
            mergeTypes: azuredevops.BranchPolicyMergeTypes;
        };
    };
}

export function createRepositories(
    config: ProjectConfig,
    projectId: pulumi.Input<string>,
    environments: EnvironmentsResult
): RepositoriesResult {
    const defaultBranch = "refs/heads/main";

    // Create main repository
    const mainRepository = new azuredevops.Git("main-repository", {
        projectId: projectId,
        name: config.repositoryMainName,
        defaultBranch: defaultBranch,
        initialization: {
            initType: "Clean",
        },
    }, {
        dependsOn: Object.values(environments.environments),
    });

    // Create template repository
    const templateRepository = new azuredevops.Git("template-repository", {
        projectId: projectId,
        name: config.repositoryTemplateName,
        defaultBranch: defaultBranch,
        initialization: {
            initType: "Clean",
        },
    }, {
        dependsOn: Object.values(environments.environments),
    });

    // Branch policies for main repository
    const hasMultipleApprovers = Object.keys(config.approvers).length > 1;

    let mainMinReviewers: azuredevops.BranchPolicyMinReviewers | undefined;
    if (hasMultipleApprovers) {
        mainMinReviewers = new azuredevops.BranchPolicyMinReviewers("main-min-reviewers", {
            projectId: projectId,
            enabled: true,
            blocking: true,
            settings: {
                reviewerCount: 1,
                submitterCanVote: false,
                lastPusherCannotApprove: true,
                allowCompletionWithRejectsOrWaits: false,
                onPushResetApprovedVotes: true,
                scopes: [{
                    repositoryId: mainRepository.id,
                    repositoryRef: mainRepository.defaultBranch,
                    matchType: "Exact",
                }],
            },
        });
    }

    const mainMergeTypes = new azuredevops.BranchPolicyMergeTypes("main-merge-types", {
        projectId: projectId,
        enabled: true,
        blocking: true,
        settings: {
            allowSquash: true,
            allowRebaseAndFastForward: false,
            allowBasicNoFastForward: false,
            allowRebaseWithMerge: false,
            scopes: [{
                repositoryId: mainRepository.id,
                repositoryRef: mainRepository.defaultBranch,
                matchType: "Exact",
            }],
        },
    });

    // Branch policies for template repository
    let templateMinReviewers: azuredevops.BranchPolicyMinReviewers | undefined;
    if (hasMultipleApprovers) {
        templateMinReviewers = new azuredevops.BranchPolicyMinReviewers("template-min-reviewers", {
            projectId: projectId,
            enabled: true,
            blocking: true,
            settings: {
                reviewerCount: 1,
                submitterCanVote: false,
                lastPusherCannotApprove: true,
                allowCompletionWithRejectsOrWaits: false,
                onPushResetApprovedVotes: true,
                scopes: [{
                    repositoryId: templateRepository.id,
                    repositoryRef: templateRepository.defaultBranch,
                    matchType: "Exact",
                }],
            },
        });
    }

    const templateMergeTypes = new azuredevops.BranchPolicyMergeTypes("template-merge-types", {
        projectId: projectId,
        enabled: true,
        blocking: true,
        settings: {
            allowSquash: true,
            allowRebaseAndFastForward: false,
            allowBasicNoFastForward: false,
            allowRebaseWithMerge: false,
            scopes: [{
                repositoryId: templateRepository.id,
                repositoryRef: templateRepository.defaultBranch,
                matchType: "Exact",
            }],
        },
    });

    return {
        mainRepository,
        templateRepository,
        branchPolicies: {
            main: {
                minReviewers: mainMinReviewers,
                mergeTypes: mainMergeTypes,
            },
            template: {
                minReviewers: templateMinReviewers,
                mergeTypes: templateMergeTypes,
            },
        },
    };
}
