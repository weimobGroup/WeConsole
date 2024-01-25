import type { MkFuncHook } from '@mpkit/types';
import type { HookScope } from './common';
import type { MpProduct } from './product';
import type { AnyFunction, IEventEmitter, WcListFilterHandler } from './util';

export type MpProductFilter = WcListFilterHandler<MpProduct>;

export interface IMpProductController extends IEventEmitter<MpProduct> {
    findById: (id: string) => MpProduct | undefined;
    remove: (id: string) => void;
    clear: (type: HookScope, keepSaveIdList?: string[]) => void;
    getList: (type: HookScope, filter?: MpProductFilter) => MpProduct[];
    create: (data: Partial<MpProduct> & Required<Pick<MpProduct, 'id' | 'type'>>) => MpProduct;
    change: (data: Partial<MpProduct> & Required<Pick<MpProduct, 'id' | 'type'>>) => MpProduct;
}

export interface IHooker {
    replace: () => any;
    restore: () => any;
    readonly scope: HookScope;
    readonly hooks: MkFuncHook[];
    readonly target?: AnyFunction;
}

export interface WeFuncHookState {
    id: string;
    funcName: string;
    scope: HookScope;
    product: MpProduct;
    controller: IMpProductController;
    hookApiCallback?: boolean;
}
