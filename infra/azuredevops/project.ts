import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import { ProjectConfig } from "../project-config";

export interface ProjectResult {
    project?: azuredevops.Project;
    projectData?: pulumi.Output<azuredevops.GetProjectResult>;
    projectName: pulumi.Output<string>;
    projectId: pulumi.Output<string>;
}

export function createProject(config: ProjectConfig, provider: azuredevops.Provider): ProjectResult {
    if (config.azureDevopsCreateProject) {
        // Create new project
        const project = new azuredevops.Project("project", {
            name: config.projectName,
        }, { provider });

        return {
            project,
            projectName: project.name,
            projectId: project.id,
        };
    } else {
        // Use existing project
        const projectData = azuredevops.getProjectOutput({
            name: config.azureDevopsProject,
        }, { provider });

        return {
            projectData,
            projectName: projectData.apply(p => p.name || config.azureDevopsProject),
            projectId: projectData.apply(p => p.id || ""),
        };
    }
}
