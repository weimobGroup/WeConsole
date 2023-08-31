import { hookFunc, replaceFunc } from '@mpkit/func-helper';
import { MkFuncHook, MkReplaceFuncStore, MpViewFactory } from '@mpkit/types';
import { HookScope } from '../types/common';
import { IHooker } from '../types/hook';
import { wcScopeSingle, log } from './util';

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error'];
const SigleScopes = [HookScope.Api, HookScope.App, HookScope.Component, HookScope.Page, HookScope.Console];
export class Hooker implements IHooker {
    readonly target?: AnyFunction;
    readonly scope: HookScope;
    readonly hooks: MkFuncHook[];
    private stores?: MkReplaceFuncStore[];
    private native?: any;

    private constructor(
        scope: HookScope,
        hooks: MkFuncHook[],
        original?: AnyFunction,
        originalName?: string,
        otherState?: any
    ) {
        // eslint-disable-next-line no-param-reassign
        otherState = otherState || {};

        this.scope = scope;
        this.hooks = hooks;
        this.stores = [];
        if (scope === HookScope.App) {
            this.native = App;
            App = replaceFunc(
                App,
                hookFunc(App, false, this.hooks, {
                    funcName: 'App',
                    scope: this.scope,
                    ...otherState
                }).func,
                (store) => {
                    this.stores.push(store);
                }
            ) as MpViewFactory;
            return;
        }
        if (scope === HookScope.Page) {
            this.native = Page;
            Page = replaceFunc(
                Page,
                hookFunc(Page, false, this.hooks, {
                    funcName: 'Page',
                    scope: this.scope,
                    ...otherState
                }).func,
                (store) => {
                    this.stores.push(store);
                }
            ) as MpViewFactory;
            return;
        }
        if (scope === HookScope.Component) {
            this.native = Component;
            Component = replaceFunc(
                Component,
                hookFunc(Component, false, this.hooks, {
                    funcName: 'Component',
                    scope: this.scope,
                    ...otherState
                }).func,
                (store) => {
                    this.stores.push(store);
                }
            ) as MpViewFactory;
            return;
        }
        if (scope === HookScope.Api) {
            this.native = wx;
            const target = {};
            for (const prop in wx) {
                if (typeof wx[prop] === 'function') {
                    const mehtod = wx[prop].bind(wx);
                    target[prop] = replaceFunc(
                        mehtod,
                        hookFunc(mehtod, false, this.hooks, {
                            funcName: prop,
                            scope: this.scope,
                            ...otherState
                        }).func,
                        (store) => {
                            this.stores.push(store);
                        }
                    );
                } else if (prop === 'cloud') {
                    // 云开发相关
                    for (const cloudProp in wx.cloud) {
                        if (typeof wx.cloud[cloudProp] === 'function') {
                            const mehtod = wx.cloud[cloudProp].bind(wx.cloud);
                            wx.cloud[cloudProp] = replaceFunc(
                                mehtod,
                                hookFunc(mehtod, false, this.hooks, {
                                    funcName: `cloud.${cloudProp}`,
                                    scope: this.scope,
                                    hookApiCallback: false,
                                    ...otherState
                                }).func,
                                (store) => {
                                    this.stores.push(store);
                                }
                            );
                        }
                    }
                    target[prop] = wx.cloud;
                } else {
                    target[prop] = wx[prop];
                }
            }
            wx = target;
            return;
        }
        if (scope === HookScope.Console) {
            this.native = console;
            const org = {};
            for (const prop in console) {
                if (CONSOLE_METHODS.indexOf(prop) !== -1 && typeof console[prop] === 'function') {
                    const mehtod = console[prop].bind(console);
                    org[prop] = mehtod;
                    console[prop] = replaceFunc(
                        mehtod,
                        hookFunc(mehtod, false, this.hooks, {
                            funcName: prop,
                            scope: this.scope,
                            ...otherState
                        }).func,
                        (store) => {
                            this.stores.push(store);
                        }
                    );
                }
            }
            (console as any).org = org;
            return;
        }
        if (!original || typeof original !== 'function') {
            log('error', '原始函数为空，无法hook');
            return;
        }
        if (scope === HookScope.AppMethod || scope === HookScope.PageMethod || scope === HookScope.ComponentMethod) {
            this.native = original;
            this.target = replaceFunc(
                original,
                hookFunc(original, false, this.hooks, {
                    funcName: originalName,
                    scope: this.scope,
                    ...otherState
                }).func,
                (store) => {
                    this.stores.push(store);
                }
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    static for(
        scope: HookScope,
        hooks: MkFuncHook[],
        original?: AnyFunction,
        originalName?: string,
        otherState?: any
    ): Hooker {
        if (SigleScopes.indexOf(scope) !== -1) {
            return wcScopeSingle(
                `HookerOf${scope}`,
                () => new Hooker(scope, hooks, original, originalName, otherState)
            ) as Hooker;
        }
        return new Hooker(scope, hooks, original, originalName, otherState);
    }

    replace() {
        if (this.stores) {
            this.stores.forEach((item) => item.replace());
        }
    }

    restore() {
        if (this.stores) {
            this.stores.forEach((item) => item.restore());
        }
    }
}
