// src/shims-q-app.d.ts
declare module '#q-app/wrappers' {
  // import type { QuasarAppConfig } from '@quasar/app-vite';

  export function defineConfig<T = unknown>(
    callback: (ctx: {
      dev: boolean;
      prod: boolean;
      mode: {
        pwa: boolean;
        ssr: boolean;
        cordova: boolean;
        capacitor: boolean;
        electron: boolean;
        bex: boolean;
        spa: boolean;
      };
      modeName: string;
      target: {
        browser: boolean;
        node: boolean;
        electron: boolean;
        bex: boolean;
        ssr: boolean;
        capacitor: boolean;
        cordova: boolean;
      };
      targetName: string;
      emulator: boolean;
      arch: {
        neutral: boolean;
      };
      debug: boolean;
    }) => T,
  ): T;

  export function boot<T = unknown>(
    callback: (params: {
      app: unknown;
      router: unknown;
      store: unknown;
      ssrContext?: unknown;
      urlPath: string;
      publicPath: string;
      redirect: (url: string) => void;
    }) => T | Promise<T>,
  ): T;

  export function configure<T = unknown>(callback: (ctx: unknown) => T): T;

  export function preFetch<T = unknown>(
    callback: (params: {
      store: unknown;
      ssrContext?: unknown;
      currentRoute: unknown;
      previousRoute: unknown;
      redirect: (url: string) => void;
      urlPath: string;
      publicPath: string;
    }) => T | Promise<T>,
  ): T;
}
