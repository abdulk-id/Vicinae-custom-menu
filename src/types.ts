// A single entry in a menu. Can either run a shell command or show a submenu.
export type MenuEntry =
    | {
          type: "command";
          title: string;
          subtitle?: string;
          icon?: string;
          command: string;
          togglable?: false; // When true, the entry behaves as a toggle. Requires `stateCommand`, `titleOn`, and `titleOff`.
      }
    | {
          type: "command";
          title: string;
          subtitle?: string;
          icon?: string;
          command: string;
          togglable: true;
          stateCommand: string; // Shell command that prints "true" to stdout when the feature is ON, "false" when OFF.
          titleOn: string; // Title shown when the feature is currently ON (e.g. "Disable Night Mode")
          titleOff: string; // Title shown when the feature is currently OFF (e.g. "Enable Night Mode")
      }
    | {
          type: "submenu";
          title: string;
          subtitle?: string;
          menuTitle: string;
          icon?: string;
          entries: MenuEntry[];
      };

export interface MenuConfig {
    // Title shown in the toast notification of the root view
    title: string;
    entries: MenuEntry[];
}
