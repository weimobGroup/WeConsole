import { WcListFilterHandler } from '../types/util';
import { MpStackInfo } from '../types/common';
import { WeConsoleScope } from '../types/scope';

export const now = (() => {
    let p;
    return (): number => {
        if (!p) {
            p = typeof performance !== 'undefined' && 'now' in performance ? performance : Date;
        }
        return p.now();
    };
})();

export const getGlobal = (() => {
    let res;
    return (): any => {
        if (res) {
            return res;
        }
        if (typeof global === 'object' && global) {
            res = global;
        } else if (typeof globalThis === 'object' && globalThis) {
            res = globalThis;
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
        } else if (typeof this === 'object' && this) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
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
    return <T = any>(name: string, creater?: Function): undefined | T | Promise<T> => {
        if (!G.SingleMap) {
            G.SingleMap = {};
        }

        if (!(name in G.SingleMap) && creater) {
            G.SingleMap[name] = creater();
        }
        if (name in G.SingleMap) {
            if (G.SingleMapPromise[name]) {
                G.SingleMapPromise[name].forEach((item) => item(G.SingleMap[name]));
                delete G.SingleMapPromise[name];
            }

            return G.SingleMap[name];
        }
        return new Promise((resolve) => {
            if (!G.SingleMapPromise[name]) {
                G.SingleMapPromise[name] = [];
            }
            G.SingleMapPromise[name].push(resolve);
        });
    };
})();

export const isMpViewEvent = (obj) =>
    typeof obj === 'object' && obj && 'type' in obj && obj.type && 'currentTarget' in obj && obj.currentTarget;

// const STACK_TRACE = '$$$trace_stack$$$';
export const $$getStack = (): MpStackInfo[] => {
    return [];
    /*
    const res: MpStackInfo[] = [];
    try {
        throw new Error(STACK_TRACE);
    } catch (error) {
        const stack = (error as Error).stack || '';
        if (stack) {
            stack.split('\n').forEach((item, index) => {
                if (item.indexOf(STACK_TRACE) === -1 && item.indexOf('$$getStack') === -1) {
                    const stack: MpStackInfo = {
                        original: item,
                        target: ''
                    };
                    item = item.trim();
                    let file = '';
                    let target = '';
                    const hasReal = item.indexOf(']');
                    if (hasReal !== -1) {
                        const before = item.substr(0, hasReal).split('[');
                        stack.method = before[1].split(' ')[1];
                        const arr = before[0].split(' ');
                        target = arr[1];
                        file = item.substr(hasReal + 1).trim();
                    } else {
                        const arr = item.split(' ');
                        if (arr.length > 1) {
                            if (arr[1].startsWith('http')) {
                                file = `(${arr[1]})`;
                            } else {
                                target = arr[1];
                                file = arr[2];
                            }
                        }
                    }
                    if (target) {
                        stack.target = target;
                        stack.ascription = target.substr(0, target.lastIndexOf('.'));
                        const method = target.substr(target.lastIndexOf('.') + 1);
                        if (!(method === '<computed>' && stack.method)) {
                            stack.method = method;
                        }
                    }
                    if (file && file.startsWith('(')) {
                        let fileName: string, lineNumebr: string, column: string;
                        let arr = file.split('.js');
                        if (arr.length > 1) {
                            fileName = arr[0] + '.js';
                            if (arr[1] && arr[1].startsWith(':')) {
                                arr = arr[1].substr(1).split(':');
                                lineNumebr = arr[0];
                                column = arr[1];
                            }
                        } else {
                            fileName = arr[0];
                        }
                        stack.fileName = fileName.substr(1);

                        if (lineNumebr) {
                            stack.lineNumebr = parseInt(lineNumebr);
                            if (isNaN(stack.lineNumebr)) {
                                delete stack.lineNumebr;
                            }
                        }
                        if (column) {
                            column = column.substr(0, column.length - 1);

                            stack.column = parseInt(column);
                            if (isNaN(stack.column)) {
                                delete stack.column;
                            }
                        }
                    }
                    res.push(stack);
                }
            });
        }
    }
    return res; */
};

let errount = 0;
export const log = (type = 'log', ...args) => {
    if (type === 'error' && (typeof args[0] === 'object' ? args[0].message : String(args[0])).indexOf('max') !== 0) {
        errount++;
        if (errount > 3) {
            return;
        }
    }
    if ((console as any).org && (console as any).org[type]) {
        return (console as any).org[type].apply(null, args);
    }
    return console[type].apply(console, args);
};

export const FILTER_BREAK = Symbol('break');

export const filter = <T = any>(list: T[], filter: WcListFilterHandler<T>): T[] => {
    const res: T[] = [];
    for (let len = list.length, i = 0; i < len; i++) {
        const temp = filter(list[i], i, list);
        if (temp) {
            res.push(list[i]);
        }
        if (temp === FILTER_BREAK) {
            break;
        }
    }
    return res;
};

export const hookApiMethodCallback = (apiName: string, onSuccess: Function, onFail: Function, args: any[]) => {
    if (!apiName.endsWith('Sync') && (!args.length || args[0] === null)) {
        args[0] = {};
    }
    if (typeof args[0] === 'object' && args[0]) {
        const { success, fail } = args[0];
        args[0].success = function HookApiSuccessCallback(...params) {
            onSuccess(...params);
            return success?.apply(this, params);
        };
        args[0].fail = function HookApiFailCallback(...params) {
            onFail(...params);
            return fail?.apply(this, params);
        };
    }
    return args;
};

export const toHump = (name: string): string => {
    name = name.replace(/_(\w)/g, (all, letter) => {
        return letter.toUpperCase();
    });
    name = name.replace(/-(\w)/g, (all, letter) => {
        return letter.toUpperCase();
    });
    return name;
};

export const promiseifyApi = (apiName: string, ...apiArgs: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        const apiVar = wx;
        if (typeof apiVar[apiName] === 'function') {
            hookApiMethodCallback(
                apiName,
                (...args) => {
                    if (args.length < 2) {
                        resolve(args[0]);
                    } else {
                        resolve(args);
                    }
                },
                (...args) => {
                    const err = new Error('未知错误');
                    if (args.length < 2 && args[0] && args[0].errMsg) {
                        err.message = args[0].errMsg;
                    }
                    (err as any).failResult = args;
                    reject(err);
                },
                apiArgs
            );
            if (apiName.indexOf('Sync') === -1) {
                const apiOptions = apiArgs[0];
                const res = apiVar[apiName](apiOptions);
                if (res && apiOptions && typeof apiOptions.onResultReady === 'function') {
                    apiOptions.onResultReady(res);
                }
            } else {
                try {
                    const res = apiVar[apiName](apiArgs);
                    resolve(res);
                } catch (error) {
                    reject(error);
                }
            }
        } else {
            resolve(apiVar[apiName]);
        }
    });
};

export const getMpViewType = (obj: any): 'App' | 'Page' | 'Component' | undefined => {
    if (('route' in obj || '__route__' in obj) && 'setData' in obj) {
        return 'Page';
    }
    if ('triggerEvent' in obj && 'setData' in obj) {
        return 'Component';
    }
    if (typeof getApp === 'function' && getApp() === obj) {
        return 'App';
    }
};

const _has = Object.prototype.hasOwnProperty;
export const has = (obj: any, prop: string): boolean => _has.call(obj, prop);

export const EACH_BREAK = Symbol('EACH_BREAK');

export const each = (obj: any, handler: Function) => {
    if (
        Array.isArray(obj) ||
        (obj && 'length' in obj && typeof obj.length === 'number' && parseInt(obj.length) === obj.length)
    ) {
        for (let i = 0, len = obj.length; i < len; i++) {
            if (has(obj, String(i))) {
                const res = handler(i, obj[i]);
                if (res === EACH_BREAK) {
                    break;
                }
            }
        }
        return;
    }
    if (typeof obj === 'object' && obj) {
        for (const prop in obj) {
            if (has(obj, prop)) {
                const res = handler(prop, obj[prop]);
                if (res === EACH_BREAK) {
                    break;
                }
            }
        }
    }
};
