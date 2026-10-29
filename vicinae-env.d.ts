/// <reference types="@vicinae/api">

/*
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 */

type ExtensionPreferences = {
  
}

declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Command: Open Custom Menu */
	export type OpenMenu = ExtensionPreferences & {
		/** Config File Path - Absolute path to your menus.json config file. */
		"config-path"?: string;
	}
}

declare namespace Arguments {
  /** Command: Open Custom Menu */
	export type OpenMenu = {
		
	}
}