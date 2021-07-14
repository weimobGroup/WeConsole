import { Hooker } from './modules/hooker';
import { FormatApiMethodCallbackHook, FuncIDHook, MpProductHook, MpViewFactoryHook } from './modules/hooks';
import { MpProductController } from './modules/controller';
import { MkFuncHook } from '@mpkit/types';
import { wcScopeSingle, wcScope } from './modules/util';
import { WeFuncHookState } from './types/hook';
import { HookScope } from './types/common';
import { MpUIConfig } from './types/config';
import { emit } from './modules/ebus';
import { WcCustomAction } from './types/other';
import { WeConsoleEvents } from './types/scope';
export * from './modules/ebus';

export { log } from './modules/util';

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
        return HookerList.forEach((item) => item.replace());
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

/** 获取小程序内weconsole已经监控到的所有的App/Page/Component实例 */
export const getWcControlMpViewInstances = (): any[] => wcScopeSingle('MpViewInstances', () => []) as any[];

export const setUIConfig = (config: Partial<MpUIConfig>) => {
    const scope = wcScope();
    if (!scope.UIConfig) {
        scope.UIConfig = {};
    }
    Object.assign(scope.UIConfig, config);
    emit(WeConsoleEvents.WcUIConfigChange, scope.UIConfig);
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

global.addCustomAction = addCustomAction;
global.removeCustomAction = removeCustomAction;

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
