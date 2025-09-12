import * as pulumi from "@pulumi/pulumi";

export function getConfigValue<T>(
    config: pulumi.Config,
    key: string,
    init?: Partial<Record<string, unknown>>,
    defaultValue?: T
): T {
    if (init && key in init && init[key] !== undefined) {
        return init[key] as T;
    }
    const pulumiValue = config.get(key);
    if (pulumiValue !== undefined) {
        return pulumiValue as unknown as T;
    }
    return defaultValue as T;
}
