# Copilot Instructions

## Casing Standards

- **Files:** Use kebab-case (e.g., `project-config.ts`, `user-assigned-identity.ts`)
- **Classes, Types, Interfaces:** Use PascalCase (e.g., `ProjectConfig`, `ResourceNameTemplates`)
- **Variables, Properties, Configurations:** Use camelCase (e.g., `resourceGroupName`, `personalAccessToken`)

## Config Management

- All configuration values should be accessed via a single `ProjectConfig` class (in `project-config.ts`), which extends `pulumi.Config` and exposes all properties in camelCase.
- Default values should be set in the class constructor, using Pulumi config values if present, otherwise falling back to project defaults.
- **Configuration Merging:** When loading object configurations from Pulumi (like `environments` or `providers`), always merge loaded configuration with defaults to ensure all required properties are present. Stack-specific configurations can override base configurations completely, so missing properties must be filled from defaults.
- Use the pattern: `const loadedConfig = this.getObject<Type>('key') || {}; this.config = { ...defaults, ...loadedConfig }` to ensure proper merging.

## Provider Management

- **Selective Provider Isolation:** This project uses `pulumi:disable-default-providers: ["azure-native", "azure", "azuread"]` to enforce explicit provider management for Azure resources while allowing other providers (like Azure DevOps) to use default providers.
- **Azure Environment Isolation:** All Azure resources must use environment-specific providers created through the proper provider creation workflow to ensure complete environment isolation.
- **Flexible Azure Authentication:** 
  - **Local Development**: Uses Azure CLI authentication automatically when CLI context is available
  - **CI/CD (Azure DevOps)**: Uses OIDC authentication when OIDC tokens and clientId are configured
  - **Service Principal**: Uses client secret authentication when clientId and clientSecret are provided
  - **Automatic Detection**: The system automatically selects the appropriate authentication method based on available credentials
- **Azure DevOps Organization-Level:** Azure DevOps resources operate at the organization level and can use the default provider since they don't require environment isolation.
- **Never bypass Azure provider isolation:** Do not attempt to create temporary, global, or default Azure providers as workarounds when encountering provider-related errors.

## Pulumi Debugging and Logging

- **Never use `console.log` in Pulumi programs** - use `pulumi.log.debug()`, `pulumi.log.info()`, `pulumi.log.warn()`, or `pulumi.log.error()` instead.
- **Debug log messages are hidden by default** - to see debug logs, use the `-d` or `--debug` flag when running Pulumi commands:
  - `pulumi preview --debug`
  - `pulumi up --debug` 
  - `pulumi destroy --debug`
  - `pulumi import --debug`
  - `pulumi refresh --debug`
  - `pulumi watch --debug`
- Use `pulumi.log.debug()` for detailed troubleshooting information that should not appear in normal operations.
- Use `pulumi.log.info()` for important progress updates and status information.
- Use `pulumi.log.warn()` for non-fatal issues that should be brought to user attention.
- Use `pulumi.log.error()` for error conditions (though throwing exceptions is usually preferred for errors).

## General TypeScript Standards


- Use explicit types and interfaces for all structured data.
- Prefer named exports for classes and types.
- Keep all code files in kebab-case.
- **No use of `any` types.** Always use explicit, strongly-typed interfaces or types.
- Use ESLint with recommended and TypeScript rules enabled.
- Prefer `const` over `let` where possible.
- Use strict null checks and enable all strict TypeScript compiler options.
- Avoid use of `require`; use ES module imports (`import ... from ...`).
- Use single quotes for strings unless interpolating.
- Always include return types for functions and methods.
- Prefer arrow functions for inline callbacks and functional code.


## Pulumi Resource Naming Standards

- When converting from Terraform, always use the intended resource name as the first argument to the Pulumi resource constructor.
- Do **not** set the optional `name` property unless you need to override Pulumi's auto-naming.
- This ensures Pulumi outputs match your intended names and leverages auto-naming for uniqueness.

**Example:**

- Use:
	```typescript
	new azure.resources.ResourceGroup(targetResourceGroupName, { location })
	```
- Avoid:
	```typescript
	new azure.resources.ResourceGroup("target-rg", { resourceGroupName: targetResourceGroupName, location })
	```

## Example Usage

```typescript
import { ProjectConfig } from "./project-config";

const config = new ProjectConfig();
const resourceGroupName = config.resourceNameWorkload;
```

---

Use these standards for all code, configuration, and file naming in this project.
