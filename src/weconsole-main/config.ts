import type { MpUIConfig } from '@/types/config';
import type { WcCustomAction } from '@/types/other';
import type { WeConsoleScope } from '@/types/scope';
import { WeConsoleEvents } from '@/types/scope';
import type { AnyFunction } from '@/types/util';
import { uuid } from '@mpkit/util';

import { EventEmitter } from '@/main/modules/event-emitter';
import type { MpProduct } from '@/types/product';
import { MpApiCategoryMap, reportCategoryMapToList } from '@/main/modules/category';

const FinalConfig: Partial<MpUIConfig> = {
    apiCategoryGetter(product: MpProduct): string {
        if ((product.category || '').startsWith('cloud')) {
            return 'cloud';
        }
        return MpApiCategoryMap[product.category as string] || 'other';
    },
    apiCategoryList: reportCategoryMapToList(MpApiCategoryMap)
};

export const getUIConfig = (): Partial<MpUIConfig> => {
    return FinalConfig;
};

export const setUIConfig = (config: Partial<MpUIConfig>) => {
    const oldGlobal = FinalConfig.globalObject;
    Object.assign(FinalConfig, config);
    if (!FinalConfig.globalObject && oldGlobal) {
        FinalConfig.globalObject = oldGlobal;
    }
    if (FinalConfig.globalObject && NativeGlobalKey) {
        const g = getNativeGlobal();
        const old = g[NativeGlobalKey];
        delete g[NativeGlobalKey];
        Object.assign(FinalConfig.globalObject, old);
    }
    emit(WeConsoleEvents.WcUIConfigChange, FinalConfig);
};

export const checkMultiplePageStateEnabled = () => !!getUIConfig().multiplePageStateEnabled;

export const addCustomAction = (action: WcCustomAction) => {
    if (!FinalConfig.customActions) {
        FinalConfig.customActions = [];
    }
    const index = FinalConfig.customActions.findIndex((item) => item.id === action.id);
    if (index === -1) {
        FinalConfig.customActions.push(action);
    } else {
        FinalConfig.customActions[index] = action;
    }
    emit(WeConsoleEvents.WcUIConfigChange, FinalConfig);
};
export const removeCustomAction = (actionId: string) => {
    if (!FinalConfig.customActions) {
        return;
    }
    const index = FinalConfig.customActions.findIndex((item) => item.id === actionId);
    if (index !== -1) {
        FinalConfig.customActions.splice(index, 1);
        emit(WeConsoleEvents.WcUIConfigChange, FinalConfig);
    }
};

const getNativeGlobal = (() => {
    let res;
    return function g(this: any) {
        if (res) {
            return res;
        }
        if (typeof global === 'object' && global) {
            res = global;
        } else if (typeof globalThis === 'object' && globalThis) {
            res = globalThis;
        } else if (typeof this === 'object' && this) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            res = this;
        } else if (typeof wx === 'object' && wx) {
            (wx as any).__wcGlobal__ = wx.__wcGlobal__ || {};
            res = wx.__wcGlobal__;
        } else if (typeof getApp === 'function') {
            const app = getApp({ allowDefault: true });
            app.__wcGlobal__ = app.__wcGlobal__ || {};
            res = app.__wcGlobal__;
        } else {
            res = {};
        }
        return res;
    };
})();

let NativeGlobalKey;

const getGlobal = () => {
    if (typeof FinalConfig.globalObject === 'object' && FinalConfig.globalObject) {
        return FinalConfig.globalObject;
    }
    const g = getNativeGlobal();
    NativeGlobalKey = NativeGlobalKey || uuid();
    if (!g[NativeGlobalKey]) {
        g[NativeGlobalKey] = {};
    }
    return g[NativeGlobalKey];
};

export const wcScope = (): WeConsoleScope => {
    const G = getGlobal();
    if (!G.WeConsoleScope) {
        Object.defineProperty(G, 'WeConsoleScope', {
            configurable: false,
            enumerable: true,
            writable: false,
            value: {}
        });
    }
    return G.WeConsoleScope;
};

export const wcScopeSingle = (() => {
    const G = wcScope();
    if (!G.SingleMapPromise) {
        G.SingleMapPromise = {};
    }
    return <T = any>(name: string, creater?: AnyFunction): undefined | T | Promise<T> => {
        if (!G.SingleMap) {
            G.SingleMap = {};
        }

        if (!(name in G.SingleMap) && creater) {
            G.SingleMap[name] = creater();
        }
        if (name in G.SingleMap) {
            if (G.SingleMapPromise?.[name]) {
                G.SingleMapPromise[name].forEach((item) => item(G.SingleMap?.[name]));
                delete G.SingleMapPromise[name];
            }

            return G.SingleMap[name];
        }
        return new Promise((resolve) => {
            if (G.SingleMapPromise && !(name in G.SingleMapPromise)) {
                G.SingleMapPromise[name] = [];
            }
            G.SingleMapPromise && G.SingleMapPromise[name].push(resolve);
        });
    };
})();

const ev = wcScopeSingle<EventEmitter>('Ebus', () => new EventEmitter()) as EventEmitter;
export const on = ev.on;
export const off = ev.off;
export const emit = ev.emit;
export const once = ev.once;
export const ebus = ev;
