import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { MenuConfig } from "./types";

export function loadConfig(rawPath: string): MenuConfig {
    const resolved = rawPath.startsWith("~")
        ? path.join(os.homedir(), rawPath.slice(1))
        : path.resolve(rawPath);

    if (!fs.existsSync(resolved)) {
        throw new Error(`Config file not found: ${resolved}`);
    }

    const raw = fs.readFileSync(resolved, "utf-8");

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`Failed to parse JSON config: ${(e as Error).message}`);
    }

    // Basic shape validation
    const config = parsed as MenuConfig;
    if (!config.title || !Array.isArray(config.entries)) {
        throw new Error(
            'Config must have a "title" string and an "entries" array at the root.',
        );
    }

    return config;
}
