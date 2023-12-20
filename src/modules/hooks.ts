import type { MkFuncHook } from '@mpkit/types';
import { uuid } from '@mpkit/util';
import type { WeFuncHookState } from '../types/hook';
import { HookScope, MethodExecStatus, MpComponentMethodSeat } from '../types/common';
import { $$getStack, getWcControlMpViewInstances, hookApiMethodCallback, isMpViewEvent, log, now } from './util';
import { Hooker } from './hooker';
export const FuncIDHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        if (!state.state.id) {
            state.state.id = uuid();
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
                state.doneCallback(null, res);
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

export const MpProductHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
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
        const { product, controller } = state.state;
        product.endTime = product.execEndTime = now();
        product.result = state.result;
        controller.change(product);
    },
    complete(state) {
        const { controller, product } = state.state;
        const response = state.fulfilled
            ? [state.value]
            : [state.errors[state.errors.length - 1].error, state.errors[state.errors.length - 1].type];
        const status = state.fulfilled ? MethodExecStatus.Success : MethodExecStatus.Fail;
        product.endTime = now();
        product.response = response;
        product.status = status;
        controller.change(product);
    },
    catch(state) {
        const { controller, product } = state.state;
        const response = [state.errors[state.errors.length - 1].error, state.errors[state.errors.length - 1].type];
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
    otherState?: Partial<WeFuncHookState>,
    isProperties?: boolean
) => {
    const fireHook = (name, method) => {
        const hooks: MkFuncHook<WeFuncHookState>[] = [
            {
                before(state) {
                    state.state.viewFactoryId = factoryState.id;
                    state.state.hookers = factoryState.hookers;
                    state.state.controller = factoryState.controller;
                }
            },
            FuncIDHook,
            MpProductHook,
            MpViewEventHandleHook
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
            hooks.push(MpViewInsDestoryMarkHook);
        }
        if (scope === HookScope.PageMethod && name === 'onUnload') {
            hooks.push(MpViewInsDestoryMarkHook);
        }
        const hooker = Hooker.for(scope, hooks, method, name, otherState);
        factoryState?.hookers && factoryState.hookers.push(hooker);
        return hooker.target;
    };
    for (const prop in spec) {
        if (isProperties) {
            if (typeof spec[prop] === 'object' && typeof spec[prop].observer === 'function') {
                spec[prop].observer = fireHook(prop, spec[prop].observer);
            }
        } else if (typeof spec[prop] === 'function' && needHookMethods.includes(prop)) {
            spec[prop] = fireHook(prop, spec[prop]);
        }
    }
};

export const MpViewInsCacheSaveHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        // 将组件实例缓存到全局，便于view取到
        getWcControlMpViewInstances().push(state.ctx);
    }
};
export const MpViewInsDestoryMarkHook: MkFuncHook<WeFuncHookState> = {
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
    before(state) {
        // 重写setData和 triggerEvent
        if (state.ctx.setData || state.ctx.triggerEvent) {
            const { viewFactoryId, hookers, controller, scope } = state.state;
            ['setData', 'triggerEvent'].forEach((name) => {
                const method = state.ctx[name];
                const hooks: MkFuncHook<WeFuncHookState>[] = [
                    {
                        before(state) {
                            state.state.viewFactoryId = viewFactoryId;
                            state.state.hookers = hookers;
                            state.state.controller = controller;
                        }
                    },
                    FuncIDHook,
                    MpProductHook
                ];
                if (name === 'triggerEvent') {
                    hooks.push(MpViewEventTriggerHook);
                }
                const hooker = Hooker.for(scope, hooks, method, name);
                Object.defineProperty(state.ctx, name, {
                    writable: true,
                    value: hooker.target
                });
                hookers.push(hooker);
            });
        }
    }
};

export const MpViewFactoryHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        const { scope } = state.state;
        const spec = state.args[0];
        if (!spec.$wcDisabled) {
            // 执行App/Page/Component方法时将methods重写
            if (scope === HookScope.App) {
                hookSpecMethod(spec, HookScope.AppMethod, state.state);
                return;
            }
            if (scope === HookScope.Page) {
                if (!spec.onLoad) {
                    spec.onLoad = function WcOnLoadPlaceholder() {};
                }
                if (!spec.onLoad) {
                    spec.onUnload = function WcOnUnloadPlaceholder() {};
                }
                hookSpecMethod(spec, HookScope.PageMethod, state.state);
                return;
            }
            if (scope === HookScope.Component) {
                if (!spec.created && (!spec.lifetimes || !spec.lifetimes.created)) {
                    spec.lifetimes = spec.lifetimes || {};
                    spec.lifetimes.created = function WcCreatedPlaceholder() {};
                }
                if (!spec.detached && (!spec.lifetimes || !spec.lifetimes.detached)) {
                    spec.lifetimes = spec.lifetimes || {};
                    spec.lifetimes.detached = function WcDetachedPlaceholder() {};
                }
                const lifetimes = Object.keys(spec).filter(
                    (key) => typeof spec[key] === 'function' && (!spec.lifetimes || !spec.lifetimes[key])
                );
                const lifetimesMap = {};
                lifetimes.forEach((name) => {
                    lifetimesMap[name] = spec[name];
                });
                hookSpecMethod(lifetimesMap, HookScope.ComponentMethod, state.state, {
                    componentMethodSeat: MpComponentMethodSeat.lifetimes
                });
                lifetimes.forEach((name) => {
                    spec[name] = lifetimesMap[name];
                    delete lifetimesMap[name];
                });
                spec.methods &&
                    hookSpecMethod(spec.methods, HookScope.ComponentMethod, state.state, {
                        componentMethodSeat: MpComponentMethodSeat.methods
                    });
                spec.pageLifetimes &&
                    hookSpecMethod(spec.pageLifetimes, HookScope.ComponentMethod, state.state, {
                        componentMethodSeat: MpComponentMethodSeat.pageLifetimes
                    });
                spec.lifetimes &&
                    hookSpecMethod(spec.lifetimes, HookScope.ComponentMethod, state.state, {
                        componentMethodSeat: MpComponentMethodSeat.lifetimes
                    });
                spec.properties &&
                    hookSpecMethod(
                        spec.properties,
                        HookScope.ComponentMethod,
                        state.state,
                        {
                            componentMethodSeat: MpComponentMethodSeat.propObserver
                        },
                        true
                    );
                spec.observers &&
                    hookSpecMethod(spec.observers, HookScope.ComponentMethod, state.state, {
                        componentMethodSeat: MpComponentMethodSeat.observers
                    });
            }
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
        const { controller, id } = state.state;
        const args = state.args;
        if (isMpViewEvent(args[0])) {
            const wrapDetail = args[0].detail;
            if (typeof wrapDetail === 'object' && wrapDetail && wrapDetail._mpcWrap) {
                args[0].detail = wrapDetail.orgDetail;
                controller.change({
                    id,
                    eventTriggerPid: wrapDetail.id
                });

                controller.change({
                    id: wrapDetail.id,
                    eventHandlePid: id
                });
            }
        }
    }
};
