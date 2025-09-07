# Azure DevOps Pulumi OIDC CI/CD

This project demonstrates how to set up Azure DevOps CI/CD pipelines with Pulumi using OpenID Connect (OIDC) authentication. It provides a complete infrastructure-as-code solution for bootstrapping Azure DevOps projects with self-hosted agents, secure service connections, and automated deployment pipelines.

## Credits and Acknowledgments

This project is a **Pulumi conversion** of the excellent [Azure DevOps Terraform OIDC CI/CD](https://learn.microsoft.com/en-us/samples/azure-samples/azure-devops-terraform-oidc-ci-cd/azure-devops-terraform-oidc-ci-cd/) sample by Microsoft Azure Samples. 

**Original Project:**
- 📖 **Documentation**: [Microsoft Learn Sample](https://learn.microsoft.com/en-us/samples/azure-samples/azure-devops-terraform-oidc-ci-cd/azure-devops-terraform-oidc-ci-cd/)
- 🔗 **Source Repository**: [Azure-Samples/azure-devops-terraform-oidc-ci-cd](https://github.com/Azure-Samples/azure-devops-terraform-oidc-ci-cd)

**Special Thanks** to the Microsoft Azure Samples team and contributors for creating the original Terraform implementation that served as the foundation for this Pulumi conversion. Their comprehensive approach to Azure DevOps automation with OIDC authentication patterns has been invaluable.

## When to Use This Project

- You want to implement Azure DevOps CI/CD with OIDC authentication using Pulumi instead of Terraform
- You need a complete infrastructure setup for Azure DevOps projects with self-hosted agents
- You're looking to automate Azure DevOps project creation, service connections, and pipeline deployment
- You want to explore Pulumi's Azure Native SDK and Azure DevOps provider integrationNative TypeScript Pulumi Template

 This template provides a minimal, ready-to-go Pulumi program for deploying Azure resources using the Azure Native provider in TypeScript. It establishes a basic infrastructure stack that you can use as a foundation for more complex deployments.

 ## When to Use This Template

 - You need a quick boilerplate for Azure Native deployments with Pulumi and TypeScript
 - You want to create a Resource Group and Storage Account as a starting point
 - You’re exploring Pulumi’s Azure Native SDK and TypeScript support

 ## Features

This Pulumi implementation includes all the key features from the original Terraform project:

- **OIDC Authentication**: Secure, keyless authentication between Azure DevOps and Azure
- **Self-Hosted Agents**: Automated provisioning of Azure Container Instances or Container Apps for CI/CD agents
- **Infrastructure as Code**: Complete Azure and Azure DevOps resource management using Pulumi
- **Project Automation**: Automated creation of Azure DevOps projects, repositories, and pipelines
- **Layered Configuration**: Flexible configuration management with environment-specific settings
- **Security Best Practices**: Managed identities, private networking, and secure service connections

## Architecture

The solution deploys the following components:

### Azure Resources
- **Resource Groups**: Organized by purpose (state, agents, identity)
- **Storage Account**: Secure state management with private endpoints
- **Virtual Network**: Isolated networking for agents and private endpoints
- **Managed Identities**: User-assigned identities for secure Azure access
- **Container Infrastructure**: Self-hosted agents using Azure Container Instances or Container Apps

### Azure DevOps Resources
- **Project**: Automated project creation and configuration
- **Service Connections**: OIDC-based connections to Azure subscriptions
- **Agent Pools**: Self-hosted agent pool configuration
- **Repositories**: Git repositories with branch policies and security
- **Pipelines**: CI/CD pipelines with automated deployment workflows
- **Environments**: Deployment environments with approval gates

 ## Prerequisites

- An active Azure subscription with appropriate permissions
- Node.js (LTS version) installed
- Pulumi CLI installed and configured
- Azure CLI installed and authenticated (`az login`)
- Azure DevOps organization with sufficient permissions
- Azure DevOps Personal Access Token (PAT) with required scopes

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <this-repository>
   cd azure-devops-pulumi-oidc-ci-cd/infra
   npm install
   ```

2. **Configure Your Stack**
   ```bash
   pulumi config set azure-native:location "East US 2"
   pulumi config set --secret personalAccessToken "your-azure-devops-pat"
   pulumi config set organizationName "your-azure-devops-org"
   # ... additional configuration as needed
   ```

3. **Deploy Infrastructure**
   ```bash
   pulumi up
   ```

 ## Project Structure

```
.
├── infra/                           # Pulumi infrastructure code
│   ├── azure/                       # Azure resource modules
│   │   ├── agents.ts               # Self-hosted agent infrastructure
│   │   ├── managed-identities.ts   # User-assigned managed identities
│   │   ├── resource-groups.ts      # Resource group organization
│   │   ├── storage.ts              # State storage and private endpoints
│   │   └── virtual-network.ts      # Networking infrastructure
│   ├── azuredevops/                # Azure DevOps resource modules
│   │   ├── agents.ts               # Agent pools and queues
│   │   ├── environments.ts         # Deployment environments
│   │   ├── pipelines.ts            # CI/CD pipeline definitions
│   │   ├── project.ts              # Project creation and configuration
│   │   ├── repositories.ts         # Git repository management
│   │   └── service-connections.ts  # OIDC service connections
│   ├── sdks/                       # Generated Terraform module SDKs
│   │   └── azure-agents/           # Azure agent Terraform module
│   ├── index.ts                    # Main Pulumi program
│   ├── project-config.ts           # Configuration management
│   ├── layered-config.ts           # Configuration layer utilities
│   └── package.json                # Dependencies and scripts
├── pipelines/                      # Azure DevOps pipeline templates
│   ├── main/                       # Main pipeline definitions
│   └── templates/                  # Reusable pipeline templates
├── STRUCTURE.md                    # Detailed project structure
└── README.md                       # This file
```

## Configuration

The project uses Pulumi's configuration system with support for layered configuration (stack config, environment variables, and defaults). Key configuration options include:

### Required Configuration
- `personalAccessToken`: Azure DevOps PAT (secret)
- `organizationName`: Your Azure DevOps organization
- `location`: Azure region for resource deployment

### Optional Configuration  
- `useSelfHostedAgents`: Enable self-hosted agents (default: true)
- `selfHostedAgentType`: Agent type (`azure_container_instance` or `azure_container_app`)
- `resourceNameWorkload`: Workload identifier for resource naming
- `addressSpace`: Virtual network address space
- `agentUseAvailabilityZones`: Enable availability zones for agents

See `project-config.ts` for the complete configuration schema.

 ## Key Differences from the Original Terraform Version

While maintaining feature parity with the original Terraform implementation, this Pulumi version offers several advantages:

- **Strongly-typed Configuration**: TypeScript interfaces ensure configuration correctness at compile time
- **Native Azure SDK Integration**: Direct integration with Azure Native APIs rather than Terraform provider translation
- **Component-based Architecture**: Modular design with clear separation of concerns
- **Enhanced Developer Experience**: IntelliSense, type checking, and modern IDE support
- **Simplified State Management**: Pulumi's built-in state management removes the need for manual backend configuration

## Resources Created

The infrastructure creates the following resources organized by purpose:

### Azure Infrastructure
- Resource Groups (state, agents, identity)
- Storage Account with blob containers and private endpoints
- Virtual Network with subnets for agents and private endpoints
- User-assigned Managed Identities with appropriate role assignments
- Container infrastructure for self-hosted agents

### Azure DevOps Configuration  
- Project with Git repositories and branch policies
- Service connections using OIDC authentication
- Agent pools and queues for self-hosted agents
- Deployment environments with approval workflows
- CI/CD pipelines with automated infrastructure deployment

## Outputs

After successful deployment, the stack exports:
- **projectId**: Azure DevOps project identifier
- **agentPoolName**: Name of the created agent pool
- **serviceConnectionIds**: OIDC service connection identifiers
- **storageAccountName**: Name of the state storage account

 ## Next Steps

After deploying the infrastructure:

1. **Verify Agent Registration**: Check that self-hosted agents appear in your Azure DevOps agent pool
2. **Test Pipelines**: Run the created CI/CD pipelines to verify OIDC authentication
3. **Customize Configuration**: Modify `project-config.ts` for your specific requirements
4. **Extend Infrastructure**: Add additional Azure resources or Azure DevOps configurations
5. **Implement Environment Promotion**: Set up multi-environment deployment workflows

## Contributing

This project follows the patterns established by the original Terraform implementation. When contributing:

- Maintain compatibility with the original project's configuration schema
- Follow the established naming conventions and resource organization
- Ensure TypeScript type safety and proper error handling
- Update documentation for any new features or changes

## Getting Help

If you encounter issues or have questions:

- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **Azure DevOps Provider**: https://www.pulumi.com/registry/packages/azuredevops/
- **Original Terraform Project**: [Azure-Samples/azure-devops-terraform-oidc-ci-cd](https://github.com/Azure-Samples/azure-devops-terraform-oidc-ci-cd)
- **Pulumi Community**: https://pulumi-community.slack.com/
- **Issues**: File issues in this repository for Pulumi-specific problems

## License

This project maintains the same license as the original Terraform implementation. Please refer to the LICENSE file for details.