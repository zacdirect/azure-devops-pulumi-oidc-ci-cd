import * as pulumi from "@pulumi/pulumi";
import * as azuredevops from "@pulumi/azuredevops";
import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import { ProjectConfig } from "../project-config";
import { RepositoriesResult } from "./repositories";

export interface RepositoryFilesResult {
    mainRepositoryFiles: azuredevops.GitRepositoryFile[];
    templateRepositoryFiles: azuredevops.GitRepositoryFile[];
}

export function createRepositoryFiles(
    config: ProjectConfig,
    repositories: RepositoriesResult
): RepositoryFilesResult {
    const mainRepositoryFiles: azuredevops.GitRepositoryFile[] = [];
    const templateRepositoryFiles: azuredevops.GitRepositoryFile[] = [];

    // Define base path for template files
    const templatesBasePath = path.resolve(__dirname, "../templates");
    
    // Helper function to read file content
    function readFileContent(filePath: string): string {
        return fs.readFileSync(filePath, 'utf8');
    }

    // Create template context for Handlebars
    const templateContext = {
        projectName: config.azureDevopsProject,
        templateRepositoryName: repositories.templateRepository.name,
        rootModuleFolderRelativePath: "infra",
        useSelfHostedAgents: config.useSelfHostedAgents,
        environments: Object.fromEntries(
            Object.entries(config.environments).map(([key, env]) => [
                key,
                {
                    ...env,
                    displayName: env.displayName || key.charAt(0).toUpperCase() + key.slice(1)
                }
            ])
        ),
        azureDevOpsSyntax: {
            coalesceParameters: "${{ coalesce(parameters.pulumiCliVersion, 'latest') }}",
            parametersTargetEnvironment: "${{ parameters.targetEnvironment }}",
            parametersEnvironmentName: "${{ parameters.environmentName }}",
            parametersServiceConnectionName: "${{ parameters.serviceConnectionName }}",
            parametersRootModulePath: "${{ parameters.rootModuleFolderRelativePath }}",
            parameterspulumiCliVersion: "${{ parameters.pulumiCliVersion }}",
            systemDefaultWorkingDirectory: "$(System.DefaultWorkingDirectory)",
            pulumiAccessToken: "$(PULUMI_ACCESS_TOKEN)"
        }
    };

    // Template files to create in the template repository
    const templateFiles = [
        "ci-template.yaml.hbs",
        "cd-template.yaml.hbs",
        "helpers/pulumi-installer.yaml.hbs",
        "helpers/pulumi-preview.yaml.hbs",
        "helpers/pulumi-up.yaml.hbs"
    ];

    templateFiles.forEach((templateFile, index) => {
        const filePath = path.join(templatesBasePath, "pipeline-templates", templateFile);
        const rawContent = readFileContent(filePath);
        
        // Compile and render the Handlebars template
        const template = Handlebars.compile(rawContent);
        const processedContent = template(templateContext);
        
        // Remove .hbs extension for the final file name
        const finalFileName = templateFile.replace('.hbs', '');
        
        const file = new azuredevops.GitRepositoryFile(`template-file-${index}`, {
            repositoryId: repositories.templateRepository.id,
            file: `pipelines/templates/${finalFileName}`,
            content: processedContent,
            branch: "refs/heads/main",
            commitMessage: `Add ${finalFileName} template`,
            overwriteOnCreate: true,
        });
        templateRepositoryFiles.push(file);
    });

    // Main pipeline files to create in the main repository
    const mainFiles = ["ci.yaml.hbs", "cd.yaml.hbs"];

    mainFiles.forEach((mainFile, index) => {
        const filePath = path.join(templatesBasePath, "main", mainFile);
        const rawContent = readFileContent(filePath);
        
        // Compile and render the Handlebars template
        const template = Handlebars.compile(rawContent);
        const processedContent = template(templateContext);
        
        // Remove .hbs extension for the final file name
        const finalFileName = mainFile.replace('.hbs', '');
        
        const file = new azuredevops.GitRepositoryFile(`main-file-${index}`, {
            repositoryId: repositories.mainRepository.id,
            file: finalFileName,
            content: processedContent,
            branch: "refs/heads/main", 
            commitMessage: `Add ${finalFileName} pipeline`,
            overwriteOnCreate: true,
        });
        mainRepositoryFiles.push(file);
    });

    return {
        mainRepositoryFiles,
        templateRepositoryFiles,
    };
}
