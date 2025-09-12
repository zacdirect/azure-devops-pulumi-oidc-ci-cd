const { expect } = require("chai");
const { ProjectConfig } = require("../project-config");

describe("ProjectConfig layered provider resolution", () => {
    it("resolves provider config with environment-specific override", () => {
        const config = new ProjectConfig();
        // Simulate Pulumi config
        (config as any).environments = {
            dev: { displayOrder: 1, displayName: "Development" },
            prod: { displayOrder: 2, displayName: "Production" }
        };
        (config as any).providers = {
            dev: { subscriptionId: "dev-sub-id", tenantId: "dev-tenant-id", useOidc: true },
            prod: { subscriptionId: "prod-sub-id", tenantId: "prod-tenant-id", useOidc: false }
        };
        const devProvider = config.resolveProvider("dev");
        const prodProvider = config.resolveProvider("prod");
        expect(devProvider.subscriptionId).to.equal("dev-sub-id");
        expect(devProvider.tenantId).to.equal("dev-tenant-id");
        expect(devProvider.useOidc).to.equal(true);
        expect(prodProvider.subscriptionId).to.equal("prod-sub-id");
        expect(prodProvider.tenantId).to.equal("prod-tenant-id");
        expect(prodProvider.useOidc).to.equal(false);
    });

    it("enforces 1:1 environment to provider relationship", () => {
        const config = new ProjectConfig();
        // Simulate environments
        (config as any).environments = {
            dev: { displayOrder: 1, displayName: "Development" },
            prod: { displayOrder: 2, displayName: "Production" }
        };
        
        // Simulate the resolved providers (what resolveProvidersConfig would return)
        // Note: resolveProvidersConfig only creates providers for environments
        (config as any).providers = {
            dev: { subscriptionId: "dev-sub-id", tenantId: "dev-tenant-id" },
            prod: { subscriptionId: "prod-sub-id", tenantId: "prod-tenant-id" }
            // "unmatched" should NOT be here since it's not an environment
        };
        
        // Environment provider resolution should use environment name as provider name
        const devProvider = config.resolveEnvironmentProvider("dev");
        const prodProvider = config.resolveEnvironmentProvider("prod");
        
        expect(devProvider.subscriptionId).to.equal("dev-sub-id");
        expect(devProvider.tenantId).to.equal("dev-tenant-id");
        expect(prodProvider.subscriptionId).to.equal("prod-sub-id");
        expect(prodProvider.tenantId).to.equal("prod-tenant-id");
        
        // Should not have a provider for "unmatched" since it's not an environment
        expect(config.getProvider("unmatched")).to.be.undefined;
    });

    it("returns undefined for missing values", () => {
        const config = new ProjectConfig();
        (config as any).environments = {
            dev: { displayOrder: 1, displayName: "Development" }
        };
        (config as any).providers = {
            dev: { }
        };
        const devProvider = config.resolveProvider("dev");
        expect(devProvider.subscriptionId).to.be.undefined;
        expect(devProvider.tenantId).to.be.undefined;
    });
});
