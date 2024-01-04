import type { MpSetDataHandler } from '@mpkit/types';
import type { MpUIConfig } from './config';
import type { IMpProductController } from './hook';
import type { MpProduct } from './product';
import type { AnyFunction, AnyObject, EventHandler } from './util';

export interface MpClientRect {
    width: number;
    height: number;
    top: number;
    left: number;
}

export interface MpEventTarget {
    dataset: {
        [prop: string]: any;
    };
}
export interface MpEvent<T = any> {
    type: string;
    target: MpEventTarget;
    currentTarget: MpEventTarget;
    detail?: T;
}

export interface MpScrollEventDetail {
    scrollTop: number;
    scrollHeight: number;
}

export interface MpViewContext<T = any> {
    data?: T;
    __wxExparserNodeId__: string;
    setData: MpSetDataHandler;
    triggerEvent: (type: string, data?: any) => any;
    createSelectorQuery: () => any;
    $wcComponentIsDestroyed?: boolean;
    $wcId: string;
    is: string;
    selectComponent: (str: string) => MpViewContext;
    selectOwnerComponent: () => MpViewContext;
}

export interface MpWcViewContext<T = any> extends MpViewContext<T> {
    $getProp: <T = any>(prop: string, val?: T) => T;
    $getBoundingClientRect: (selector: string) => Promise<MpClientRect>;
    $showToast: (title: any) => any;
    $showActionSheet: (options: any) => Promise<number>;
    $wcProductController?: IMpProductController;
    $wcProductControllerHandler?: EventHandler<MpProduct>;
    $wcUIConfig?: MpUIConfig;
    onWcProduct?: EventHandler<MpProduct>;
    $wcOn?: (name: string, handler: EventHandler) => any;
    $wcOnce?: (name: string, handler: EventHandler) => any;
    $wcEmit?: (name: string, data?: any) => any;
    $wcOff?: (name: string, handler?: EventHandler) => any;
    $updateData: (data: any, cb?: () => void) => void;
    $forceData: (data: any, cb?: () => void) => void;
}

export interface MpViewContextAny {
    [prop: string]: any;
}

export interface MpComponentMethod<T extends MpViewContext = MpViewContext> {
    (this: T, ...args);
}

export interface MpComponentProp<T extends MpViewContext = MpViewContext> {
    type: AnyFunction;
    observer?: MpComponentMethod<T>;
    value?: any;
}

export interface MpComponentMethods<T extends MpViewContext = MpViewContext> {
    [prop: string]: MpComponentMethod<T>;
}

export interface MpComponentProperties<T extends MpViewContext = MpViewContext> {
    [prop: string]: AnyFunction | MpComponentProp<T>;
}

export interface MpComponentLifeSpec<T extends MpViewContext = MpViewContext> {
    created?: MpComponentMethod<T>;
    ready?: MpComponentMethod<T>;
    moved?: MpComponentMethod<T>;
    attached?: MpComponentMethod<T>;
    detached?: MpComponentMethod<T>;
}

export interface MpComponentSpec<T extends MpViewContext = MpViewContext> extends MpComponentLifeSpec<T> {
    $wcDisabled?: boolean;
    options?: any;
    data?: any;
    properties?: MpComponentProperties<T>;
    methods?: MpComponentMethods<T> & AnyObject;
    $mixinEnd?: AnyFunction;
    externalClasses?: string[];
    pageLifetimes?: {
        show?: AnyFunction;
        hide?: AnyFunction;
        resize?: AnyFunction;
    };
}
