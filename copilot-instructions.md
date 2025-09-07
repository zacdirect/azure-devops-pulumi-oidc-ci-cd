# Copilot Instructions

## Casing Standards

- **Files:** Use kebab-case (e.g., `project-config.ts`, `user-assigned-identity.ts`)
- **Classes, Types, Interfaces:** Use PascalCase (e.g., `ProjectConfig`, `ResourceNameTemplates`)
- **Variables, Properties, Configurations:** Use camelCase (e.g., `resourceGroupName`, `personalAccessToken`)

## Config Management

- All configuration values should be accessed via a single `ProjectConfig` class (in `project-config.ts`), which extends `pulumi.Config` and exposes all properties in camelCase.
- Default values should be set in the class constructor, using Pulumi config values if present, otherwise falling back to project defaults.

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
