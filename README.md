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

## Configuration

The project uses Pulumi's configuration system with settings defined in `Pulumi.yaml`. Key configuration includes:

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

### Environments
The project exemplifies three environments matching the original Terraform setup:
- **dev**: Development environment
- **test**: Test environment (depends on dev)  
- **prod**: Production environment (requires approval, depends on test)

Environment configuration is defined directly in `Pulumi.yaml` and can be customized as needed.

See `project-config.ts` for the complete configuration schema.

 ## Key Differences from the Original Terraform Version

While maintaining feature parity with the original Terraform implementation, this Pulumi version offers several advantages:

- **Strongly-typed Configuration**: TypeScript interfaces ensure configuration correctness at compile time
- **Native Azure SDK Integration**: Direct integration with Azure Native APIs rather than Terraform provider translation
- **Component-based Architecture**: Modular design with clear separation of concerns
- **Enhanced Developer Experience**: IntelliSense, type checking, and modern IDE support
- **Simplified State Management**: Pulumi's built-in state management removes the need for manual backend configuration

### Multi-Provider Azure Configuration

Pulumi Providers offer a lot of power in a bootstrap environment like this.  So this project supports configuring different Azure providers for different environments, enabling scenarios like:

1. **Cross-subscription deployments** - Different environments in different Azure subscriptions
2. **Cross-tenant deployments** - Different environments in different Azure tenants  
3. **Dynamic credentials from ESC** - Provider credentials sourced from Pulumi ESC

### Configuration Structure

#### Providers Block

Define providers in your Pulumi configuration:

```yaml
config:
  azure-devops-pulumi-oidc-ci-cd:providers:
    prod:
      subscriptionId: "12345678-1234-1234-1234-123456789012"
      tenantId: "87654321-4321-4321-4321-210987654321"
      subscriptionName: "Production Subscription"
      useOidc: true
    staging:
      subscriptionId: "87654321-4321-4321-4321-210987654321"
      subscriptionName: "Staging Subscription"
```

#### Environment-Provider Association

Reference providers in environment configurations:

```yaml
config:
  azure-devops-pulumi-oidc-ci-cd:environments:
    dev:
      display_order: 1
      display_name: "Development"
      # No provider specified = uses default Azure context
    prod:
      display_order: 3
      display_name: "Production"
      provider: "prod"  # References the prod provider above
```

#### ESC Integration

When using Pulumi ESC for dynamic credentials, your provider can fully OIDC via Pulumi Cloud:

```yaml
values:
  azure:
    prod:
      fn::open::azure-login:
        clientId: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
        tenantId: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
        subscriptionId: /subscriptions/00000000-0000-0000-0000-000000000000
        oidc: true
  pulumiConfig:
    azure-devops-pulumi-oidc-ci-cd:providers:
      prod:
        subscriptionId: "${azure.prod.clientId}"
        tenantId: "${azure.prod.tenantId}"
        clientId: "${azure.prod.clientId}"
        useOidc: true
        subscriptionName: "Azure Prod Subscription" #Provided as config vs an actual login property
```

#### Service Connections

Service connections automatically use the appropriate provider configuration:

- **Default environments** use the current Azure context
- **Provider-specific environments** use tenant/subscription from the configured provider
- **Subscription names** are automatically set from provider configuration

This ensures service connections point to the correct Azure subscription for each environment.

#### Extended Azure Provider

The `ExtendedAzureProvider` class extends the standard Azure provider to include:

- `subscriptionName` property for display purposes
- Integration with the layered configuration system
- Automatic provider selection based on environment configuration

#### Benefits

1. **Flexibility** - Deploy to any combination of subscriptions/tenants
2. **Security** - Each environment can have its own credentials and permissions
3. **Clarity** - Service connections clearly show which subscription they target
4. **ESC Integration** - Seamless integration with Pulumi ESC for credential management


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

## Contributing

This project follows the patterns established by the original Terraform implementation. When contributing:

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
