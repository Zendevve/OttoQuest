/*
 * OttoQuest - Vencord Type Declarations
 * Stub types for standalone development
 * These are replaced by Vencord's actual types when inside src/userplugins/
 */

/// <reference types="react" />

// @webpack module
declare module "@webpack" {
  export function findByPropsLazy(...props: string[]): any;
  export function findByCodeLazy(...code: string[]): any;
  export function findStoreLazy(name: string): any;
}

// @webpack/common module
declare module "@webpack/common" {
  import * as ReactType from "react";

  export const FluxDispatcher: {
    dispatch(action: any): void;
    subscribe(event: string, callback: (data: any) => void): void;
    unsubscribe(event: string, callback: (data: any) => void): void;
  };

  export const RestAPI: {
    get(options: { url: string }): Promise<{ body: any }>;
    post(options: { url: string; body?: any }): Promise<{ body: any }>;
  };

  export const React: typeof ReactType;
}

// @api/Settings module
declare module "@api/Settings" {
  export function definePluginSettings<T extends Record<string, any>>(settings: T): T & {
    store: { [K in keyof T]: any };
    use<K extends keyof T>(keys: K[]): { [P in K]: any };
  };
}

// @api/Notifications module
declare module "@api/Notifications" {
  export function showNotification(options: {
    title: string;
    body: string;
    permanent?: boolean;
    onClick?: () => void;
  }): void;
}

// @utils/types module
declare module "@utils/types" {
  export enum OptionType {
    STRING = 0,
    NUMBER = 1,
    BIGINT = 2,
    BOOLEAN = 3,
    SELECT = 4,
    SLIDER = 5,
    COMPONENT = 6
  }

  export interface PluginDef {
    name: string;
    description: string;
    authors: { name: string; id: bigint }[];
    settings?: any;
    patches?: any[];
    flux?: Record<string, (data: any) => void>;
    start?(): void;
    stop?(): void;
    settingsAboutComponent?(): any;
    [key: string]: any;
  }

  export default function definePlugin(plugin: PluginDef): PluginDef;
}

// Global Discord types
declare const DiscordNative: any | undefined;
declare const Vencord: any;
