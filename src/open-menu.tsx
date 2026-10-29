import {
    List,
    ActionPanel,
    Action,
    Icon,
    useNavigation,
    getPreferenceValues,
    showToast,
    Toast,
    closeMainWindow,
} from "@vicinae/api";
import { exec, execSync, execFileSync } from "child_process";
import React, { useState, useEffect } from "react";
import type { MenuEntry, MenuConfig } from "./types";

function resolveIcon(name: string | undefined, fallback: Icon) {
    if (!name) {
        return fallback;
    }
    return (name as Icon) ?? fallback;
}

// State checking
/**
 * Runs stateCommand synchronously and returns true if stdout is "true", false if stdout is "false".
 * Returns null on error so the entry can show a loading/unknown state.
 */
function checkState(stateCommand: string): boolean | null {
    try {
        const output = execSync(stateCommand, { shell: "/bin/bash" }).toString().trim();
        return output === "true";
    } catch {
        return null;
    }
}

/**
 * Collect all togglable entries recursively from the entry tree and check
 * their states up-front, returning a map of stateCommand -> boolean.
 * Using stateCommand as the key means two entries sharing the same stateCommand
 * (and therefore the same state) are only checked once.
 */
function collectStates(entries: MenuEntry[]): Record<string, boolean | null> {
    const states: Record<string, boolean | null> = {};

    function walk(items: MenuEntry[]) {
        for (const entry of items) {
            if (entry.type === "submenu") {
                walk(entry.entries);
            } else if (entry.togglable) {
                if (!(entry.stateCommand in states)) {
                    const result = checkState(entry.stateCommand);
                    states[entry.stateCommand] = result ?? false;
                }
            }
        }
    }

    walk(entries);
    return states;
}

// Recursive menu view
interface MenuViewProps {
    title: string;
    entries: MenuEntry[];
    states: Record<string, boolean>; // Shared state map, initialised once at the root and passed down
}

function MenuView({ title, entries, states }: MenuViewProps) {
    const { push } = useNavigation();

    return (
        <List navigationTitle={title} searchBarPlaceholder="Search…">
            {entries.map((entry, idx) => {
                if (entry.type === "submenu") {
                    return (
                        <List.Item
                            key={idx}
                            title={entry.title}
                            subtitle={entry.subtitle}
                            icon={resolveIcon(entry.icon, Icon.ChevronRight)}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Open"
                                        icon={Icon.ArrowRight}
                                        onAction={() =>
                                            push(
                                                <MenuView
                                                    title={entry.menuTitle}
                                                    entries={entry.entries}
                                                    states={states}
                                                />,
                                            )
                                        }
                                    />
                                </ActionPanel>
                            }
                        />
                    );
                }

                // command (togglable or plain)
                const isOn = entry.togglable ? states[entry.stateCommand] : null;
                const displayTitle = entry.togglable
                    ? isOn === null
                        ? entry.title
                        : isOn
                          ? entry.titleOn
                          : entry.titleOff
                    : entry.title;
                const displayIcon = resolveIcon(entry.icon, Icon.Terminal);

                return (
                    <List.Item
                        key={idx}
                        title={displayTitle}
                        subtitle={entry.subtitle}
                        icon={displayIcon}
                        accessories={isOn !== null ? [{ text: isOn ? "On" : "Off" }] : undefined}
                        actions={
                            <ActionPanel>
                                <Action title="Run" icon={Icon.Play} onAction={() => runCommand(entry.command)} />
                            </ActionPanel>
                        }
                    />
                );
            })}
        </List>
    );
}

// Shell command runner
function runCommand(command: string) {
    exec(command, { shell: "/bin/bash" }, (err) => {
        if (err) {
            showToast({
                style: Toast.Style.Failure,
                title: "Command failed",
                message: err.message,
            });
        }
    });
    closeMainWindow(); // Close immediately, not waiting for process to finish
}

import { loadConfig } from "./config";

// Command entrypoint
export default function OpenMenu() {
    const prefs = getPreferenceValues<{ "config-path": string }>();
    const [states, setStates] = useState<Record<string, boolean> | null>(null);
    const [config, setConfig] = useState<MenuConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const loaded = loadConfig(prefs["config-path"]);
            const collected = collectStates(loaded.entries);
            setConfig(loaded);
            setStates(collected);
        } catch (e) {
            setError((e as Error).message);
        }
    }, []);

    if (error) {
        return (
            <List navigationTitle="Custom Menus">
                <List.Item title="Error loading config" subtitle={error} icon={Icon.Warning} />
            </List>
        );
    }

    if (!config || !states) {
        return <List isLoading navigationTitle="Custom Menus" />;
    }

    return <MenuView title={config.title} entries={config.entries} states={states} />;
}
