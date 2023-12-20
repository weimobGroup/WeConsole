import { Hooker } from './modules/hooker';
import { FormatApiMethodCallbackHook, FuncIDHook, MpProductHook, MpViewFactoryHook } from './modules/hooks';
import { MpProductController } from './modules/controller';
import type { MkFuncHook } from '@mpkit/types';
import { wcScopeSingle, wcScope } from './modules/util';
import type { WeFuncHookState } from './types/hook';
import { HookScope } from './types/common';
import type { MpUIConfig } from './types/config';
import { emit } from './modules/ebus';
import type { WcCustomAction } from './types/other';
import { WeConsoleEvents } from './types/scope';
export * from './modules/ebus';

export { log, getWcControlMpViewInstances } from './modules/util';

export const ProductController = wcScopeSingle<MpProductController>(
    'ProductController',
    () => new MpProductController()
) as MpProductController;

export const HookerList = wcScopeSingle<Hooker[]>('HookerList', () => []) as Hooker[];

// ProductController.on("all", (type, data) => {
//     ((console as any).org || console).log(type, data);
// });

const ProductControllerHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        state.state.controller = ProductController;
    }
};
const HookerListHook: MkFuncHook<WeFuncHookState> = {
    before(state) {
        state.state.hookers = HookerList;
    }
};

const initHooker = (scope: HookScope) => {
    if (scope === HookScope.Api) {
        HookerList.push(
            Hooker.for(HookScope.Api, [
                HookerListHook,
                ProductControllerHook,
                FuncIDHook,
                FormatApiMethodCallbackHook,
                MpProductHook
            ])
        );
        return;
    }
    if (scope === HookScope.Console) {
        HookerList.push(
            Hooker.for(HookScope.Console, [HookerListHook, ProductControllerHook, FuncIDHook, MpProductHook])
        );
        return;
    }
    if (scope === HookScope.Component) {
        HookerList.push(
            Hooker.for(HookScope.Component, [
                HookerListHook,
                ProductControllerHook,
                FuncIDHook,
                MpProductHook,
                MpViewFactoryHook
            ])
        );
        return;
    }
    if (scope === HookScope.Page) {
        HookerList.push(
            Hooker.for(HookScope.Page, [
                HookerListHook,
                ProductControllerHook,
                FuncIDHook,
                MpProductHook,
                MpViewFactoryHook
            ])
        );
        return;
    }
    if (scope === HookScope.App) {
        HookerList.push(
            Hooker.for(HookScope.App, [
                HookerListHook,
                ProductControllerHook,
                FuncIDHook,
                MpProductHook,
                MpViewFactoryHook
            ])
        );
    }
};

export const replace = (scope?: HookScope) => {
    if (!scope) {
        replace(HookScope.Console);
        replace(HookScope.Api);
        replace(HookScope.App);
        replace(HookScope.Page);
        replace(HookScope.Component);
        return;
    }
    const item = HookerList.find((item) => item.scope === scope);
    if (item) {
        item.replace();
        return;
    }
    initHooker(scope);
};
export const restore = (scope?: HookScope) => {
    if (!scope) {
        return HookerList.forEach((item) => item.restore());
    }
    const item = HookerList.find((item) => item.scope === scope);
    if (item) {
        item.restore();
    }
};

export const getUIConfig = (): Partial<MpUIConfig> => {
    const scope = wcScope();
    if (!scope.UIConfig) {
        scope.UIConfig = {};
    }
    return scope.UIConfig;
};

export const setUIConfig = (config: Partial<MpUIConfig>) => {
    const UIConfig = getUIConfig();
    Object.assign(UIConfig, config);
    emit(WeConsoleEvents.WcUIConfigChange, UIConfig);
};

export const addCustomAction = (action: WcCustomAction) => {
    const scope = wcScope();
    if (!scope.UIConfig) {
        scope.UIConfig = {};
    }
    const config: MpUIConfig = scope.UIConfig;
    if (!config.customActions) {
        config.customActions = [];
    }
    const index = config.customActions.findIndex((item) => item.id === action.id);
    if (index === -1) {
        config.customActions.push(action);
    } else {
        config.customActions[index] = action;
    }
    emit(WeConsoleEvents.WcUIConfigChange, scope.UIConfig);
};
export const removeCustomAction = (actionId: string) => {
    const scope = wcScope();
    if (scope?.UIConfig && scope.UIConfig.customActions) {
        const config: MpUIConfig = scope.UIConfig;
        const index = config.customActions.findIndex((item) => item.id === actionId);
        if (index !== -1) {
            config.customActions.splice(index, 1);
            emit(WeConsoleEvents.WcUIConfigChange, scope.UIConfig);
        }
    }
};

export const showWeConsole = () => {
    const scope = wcScope();
    scope.visable = true;
    emit(WeConsoleEvents.WcVisableChange, scope.visable);
};
export const hideWeConsole = () => {
    const scope = wcScope();
    scope.visable = false;
    emit(WeConsoleEvents.WcVisableChange, scope.visable);
};

// TODO: 暂时这样简陋下，后面做全端时重写
console.log('欢迎使用WeConsole v1.0.8，让小程序调试更高效！');
