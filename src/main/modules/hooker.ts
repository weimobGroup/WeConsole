import { hookFunc, replaceFunc } from '@mpkit/func-helper';
import type { MkFuncHook, MkReplaceFuncStore, MpViewFactory } from '@mpkit/types';
import { HookScope } from '@/types/common';
import type { IHooker } from '@/types/hook';
import { log } from './util';
import { getUIConfig, wcScopeSingle } from '../config';
import type { AnyFunction } from '@/types/util';

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error'];
const SingleScopes = [HookScope.Api, HookScope.App, HookScope.Component, HookScope.Page, HookScope.Console];

export class Hooker implements IHooker {
    readonly target: AnyFunction;
    readonly scope: HookScope;
    readonly hooks: MkFuncHook[];
    private stores: MkReplaceFuncStore[];
    private native: any;

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
            this.rewriteApiVar(otherState);
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
            ) as AnyFunction;
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
        if (SingleScopes.indexOf(scope) !== -1) {
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

    private rewriteApiVar(otherState: any) {
        if (BUILD_TARGET === 'wx') {
            this.native = wx;
        }

        if (BUILD_TARGET === 'my') {
            this.native = my;
        }

        if (BUILD_TARGET === 'swan') {
            this.native = swan;
        }

        if (BUILD_TARGET === 'tt') {
            this.native = tt;
        }

        if (BUILD_TARGET === 'xhs') {
            this.native = xhs;
        }

        if (BUILD_TARGET === 'qq') {
            this.native = qq;
        }

        if (BUILD_TARGET === 'ks') {
            this.native = ks;
        }
        const oldWx = this.native;
        const target = {};
        let setFail;
        try {
            if (BUILD_TARGET === 'wx') {
                wx = target;
            }

            if (BUILD_TARGET === 'my') {
                my = target;
            }

            if (BUILD_TARGET === 'swan') {
                swan = target;
            }

            if (BUILD_TARGET === 'tt') {
                tt = target;
            }

            if (BUILD_TARGET === 'xhs') {
                xhs = target;
            }

            if (BUILD_TARGET === 'qq') {
                qq = target;
            }

            if (BUILD_TARGET === 'ks') {
                ks = target;
            }
        } catch (error) {
            setFail = true;
        }
        const setTarget = (prop: string, val: any) => {
            if (!setFail) {
                target[prop] = val;
                return;
            }
            try {
                Object.defineProperty(oldWx, prop, {
                    value: val
                });
            } catch (error) {}
        };
        const config = getUIConfig();
        const onlyHookApiNames: Record<string, 1> = {};
        const ignoreHookApiNames: Record<string, 1> = {
            // 内置这些API属于强制忽略的名单
            nextTick: 1,
            createSelectorQuery: 1
        };
        let isOnlyHook;
        if (Array.isArray(config.onlyHookApiNames)) {
            isOnlyHook = true;
            config.onlyHookApiNames.forEach((k) => {
                onlyHookApiNames[k] = 1;
            });
        } else if (Array.isArray(config.ignoreHookApiNames)) {
            config.ignoreHookApiNames.forEach((k) => {
                ignoreHookApiNames[k] = 1;
            });
        }
        const keys = Object.keys(oldWx);
        keys.forEach((prop) => {
            if (isOnlyHook && !(prop in onlyHookApiNames)) {
                // 只有名单内的API调用会被监控
                setTarget(prop, oldWx[prop]);
                return;
            }
            if (prop in ignoreHookApiNames) {
                // 名单内的API调用不会被监控
                setTarget(prop, oldWx[prop]);
                return;
            }
            if (typeof oldWx[prop] === 'function') {
                const mehtod = oldWx[prop] || Reflect.get(oldWx, prop);
                setTarget(
                    prop,
                    replaceFunc(
                        mehtod,
                        hookFunc(mehtod, false, this.hooks, {
                            funcName: prop,
                            scope: this.scope,
                            ...otherState
                        }).func,
                        (store) => {
                            this.stores.push(store);
                        }
                    )
                );
                return;
            }
            if (prop === 'cloud') {
                // 云开发相关
                const newCloud = {};
                for (const cloudProp in oldWx.cloud) {
                    if (typeof oldWx.cloud[cloudProp] === 'function') {
                        const mehtod = oldWx.cloud[cloudProp] || Reflect.get(oldWx.cloud, prop);
                        newCloud[cloudProp] = replaceFunc(
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
                    } else {
                        newCloud[cloudProp] = oldWx.cloud[cloudProp];
                    }
                }
                setTarget(prop, newCloud);
                return;
            }
            setTarget(prop, oldWx[prop]);
        });
    }
}
