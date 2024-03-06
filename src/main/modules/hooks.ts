import type { MkFuncHook } from '@mpkit/types';
import { uuid } from '@mpkit/util';
import type { WeFuncHookState } from '@/types/hook';
import { HookScope, MethodExecStatus } from '@/types/common';
import { $$getStack, getWcControlMpViewInstances, isMpViewEvent, log, now } from './util';
import { Hooker } from './hooker';
import { hookApiMethodCallback } from 'cross-mp-power';
export const FuncIDHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        if (!state.state.id) {
            state.state.id = `${state.state.scope}-${uuid()}`;
        }
    }
};

export const FormatApiMethodCallbackHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        if (state.state.hookApiCallback === false) {
            return;
        }
        hookApiMethodCallback(
            state.state.funcName,
            (res) => {
                state.doneCallback(undefined as any, res);
            },
            (res) => {
                state.doneCallback(res);
            },
            state.args
        );
        if (state?.args[0] && state.args[0].success) {
            state.needDoneCallback = true;
        }
    }
};

const isDisableMonitor = (args: any[]) => {
    return args.some((item) => {
        return typeof item === 'object' && item && item.__wcDisableMonitor__;
    });
};

export const MpProductHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        if (isDisableMonitor(state.args)) {
            return;
        }
        state.state.product = {
            id: state.state.id,
            time: now(),
            status: MethodExecStatus.Executed,
            type: state.state.scope,
            category: state.state.funcName,
            stack: $$getStack(),
            request: state.args
        };
        state.state.controller.create(state.state.product);
    },
    after(state) {
        if (isDisableMonitor(state.args)) {
            return;
        }
        const { product, controller } = state.state;
        product.endTime = product.execEndTime = now();
        product.result = state.result;
        controller.change(product);
    },
    complete(state) {
        if (isDisableMonitor(state.args)) {
            return;
        }
        const { controller, product } = state.state;
        const response = state.fulfilled
            ? [state.value]
            : [state.errors?.[state.errors.length - 1].error, state.errors?.[state.errors.length - 1].type];
        const status = state.fulfilled ? MethodExecStatus.Success : MethodExecStatus.Fail;
        product.endTime = now();
        product.response = response;
        product.status = status;
        controller.change(product);
    },
    catch(state) {
        if (isDisableMonitor(state.args)) {
            return;
        }
        const { controller, product } = state.state;
        const response = [state.errors?.[state.errors.length - 1].error, state.errors?.[state.errors.length - 1].type];
        if (state.state.scope === HookScope.Console) {
            log('error', response[0]);
        }
        const status = MethodExecStatus.Fail;
        product.endTime = now();
        product.response = response;
        product.status = status;
        controller.change(product);
    }
};

const needHookMethods = ['created', 'detached', 'onLoad', 'onUnload'];

const hookSpecMethod = (
    spec,
    scope: HookScope,
    factoryState: WeFuncHookState,
    otherState?: Partial<WeFuncHookState>
) => {
    const wrapMethod = (name: string, method: (...args: any[]) => any) => {
        const hooks: MkFuncHook<WeFuncHookState>[] = [
            {
                before(state) {
                    state.state.controller = factoryState.controller;
                }
            }
            // FuncIDHook,
            // MpProductHook
        ];
        if (scope === HookScope.PageMethod || scope === HookScope.ComponentMethod) {
            hooks.push(MpViewEventHandleHook);
        }
        if (scope === HookScope.ComponentMethod && name === 'created') {
            hooks.push(MpViewInitLifeHook);
            hooks.push(MpViewInsCacheSaveHook);
        }
        if (scope === HookScope.PageMethod && name === 'onLoad') {
            hooks.push(MpViewInitLifeHook);
            hooks.push(MpViewInsCacheSaveHook);
        }
        if (scope === HookScope.ComponentMethod && name === 'detached') {
            hooks.push(MpViewInsDestroyMarkHook);
        }
        if (scope === HookScope.PageMethod && name === 'onUnload') {
            hooks.push(MpViewInsDestroyMarkHook);
        }
        const hooker = Hooker.for(scope, hooks, method, name, otherState);
        return hooker.target;
    };
    Object.keys(spec).forEach((prop) => {
        if (typeof spec[prop] === 'function' && needHookMethods.includes(prop)) {
            spec[prop] = wrapMethod(prop, spec[prop]);
        }
    });
};

export const MpViewInsCacheSaveHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        // 将组件实例缓存到全局，便于view取到
        getWcControlMpViewInstances().push(state.ctx);
    }
};
export const MpViewInsDestroyMarkHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        Object.defineProperty(state.ctx, '__wcDestoryed__', {
            value: true
        });
        const MpViewInstances = getWcControlMpViewInstances();
        const index = MpViewInstances.findIndex((item) => item === state.ctx);
        if (index !== -1) {
            // 销毁时要从缓存中删除，否则占用内存太严重，后面重构时避免此类设计
            MpViewInstances.splice(index, 1);
        }
    }
};

export const MpViewInitLifeHook: MkFuncHook<WeFuncHookState> = {
    before() {
        // 界面上暂时没有用到setData的地方，先注释重写setData和 triggerEvent的逻辑
        // if (state.ctx.setData || state.ctx.triggerEvent) {
        //     const { controller, scope } = state.state;
        //     ['setData', 'triggerEvent'].forEach((name) => {
        //         const method = state.ctx[name];
        //         const hooks: MkFuncHook<WeFuncHookState>[] = [
        //             {
        //                 before(state) {
        //                     state.state.controller = controller;
        //                 }
        //             },
        //             FuncIDHook,
        //             MpProductHook
        //         ];
        //         if (name === 'triggerEvent') {
        //             hooks.push(MpViewEventTriggerHook);
        //         }
        //         const hooker = Hooker.for(scope, hooks, method, name);
        //         Object.defineProperty(state.ctx, name, {
        //             writable: true,
        //             value: hooker.target
        //         });
        //     });
        // }
    }
};

const fillDefaultComponentLife = (spec: any) => {
    const hasLifetimes = typeof spec.lifetimes === 'object' && spec.lifetimes;
    ['created', 'detached'].forEach((life) => {
        if (!hasLifetimes) {
            spec[life] = spec[life] || function WcComponentLifePlaceholder() {};
            return;
        }
        spec.lifetimes[life] = spec.lifetimes[life] || function WcComponentLifePlaceholder() {};
    });
};

export const MpViewFactoryHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        const { scope } = state.state;
        const spec = state.args[0];
        spec.$wcViewType = scope;
        if (spec.$wcDisabled) {
            return;
        }
        // 执行App/Page/Component方法时将methods重写
        if (scope === HookScope.App) {
            hookSpecMethod(spec, HookScope.AppMethod, state.state);
            return;
        }
        if (scope === HookScope.Page) {
            if (!spec.onLoad) {
                spec.onLoad = function WcOnLoadPlaceholder() {};
            }
            if (!spec.onUnload) {
                spec.onUnload = function WcOnUnloadPlaceholder() {};
            }
            hookSpecMethod(spec, HookScope.PageMethod, state.state);
            return;
        }
        if (scope === HookScope.Component) {
            fillDefaultComponentLife(spec);
            hookSpecMethod(spec, HookScope.ComponentMethod, state.state);
            spec.lifetimes && hookSpecMethod(spec.lifetimes, HookScope.ComponentMethod, state.state);
            spec.methods && hookSpecMethod(spec.methods, HookScope.ComponentMethod, state.state);
            // spec.pageLifetimes &&
            //     hookSpecMethod(spec.pageLifetimes, HookScope.ComponentMethod, state.state);

            // spec.properties &&
            //     hookSpecMethod(
            //         spec.properties,
            //         HookScope.ComponentMethod,
            //         state.state,
            //         {
            //         },
            //         true
            //     );
            // spec.observers &&
            //     hookSpecMethod(spec.observers, HookScope.ComponentMethod, state.state);
        }
    }
};

export const MpViewEventTriggerHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        const { id, funcName } = state.state;
        if (funcName === 'triggerEvent') {
            const args = state.args;
            const orgDetail = args[1];
            args[1] = {
                id,
                _mpcWrap: true,
                orgDetail
            };
        }
    }
};

export const MpViewEventHandleHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        const { controller, id, scope } = state.state;
        const args = state.args;
        if (isMpViewEvent(args[0])) {
            const wrapDetail = args[0].detail;
            if (typeof wrapDetail === 'object' && wrapDetail && wrapDetail._mpcWrap) {
                args[0].detail = wrapDetail.orgDetail;
                controller.change({
                    id,
                    type: scope,
                    eventTriggerPid: wrapDetail.id
                });

                controller.change({
                    type: scope,
                    id: wrapDetail.id,
                    eventHandlePid: id
                });
            }
        }
    }
};
