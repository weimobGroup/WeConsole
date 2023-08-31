import { MkFuncHook } from '@mpkit/types';
import { HookScope, MpComponentMethodSeat, RequireId } from './common';
import { MpProduct } from './product';
import { AnyFunction, IEventEmitter, WcListFilterHandler } from './util';

export type MpProductFilter = WcListFilterHandler<MpProduct>;

export interface IMpProductController extends IEventEmitter<MpProduct> {
    getList: (filter?: MpProductFilter) => MpProduct[] | undefined;
    create: (data: Partial<MpProduct> & RequireId) => MpProduct;
    change: (data: Partial<MpProduct> & RequireId) => MpProduct;
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
    product?: MpProduct;
    controller?: IMpProductController;
    hookers?: IHooker[];
    viewFactoryId?: string;
    componentMethodSeat?: MpComponentMethodSeat;
    hookApiCallback?: boolean;
}
