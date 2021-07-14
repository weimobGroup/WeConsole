export interface MpStackInfo {
    original: string;
    lineNumebr?: number;
    column?: number;
    /** 文件路径 */
    fileName?: string;
    /** 执行目标，如：Object.keys, obj.show, print */
    target?: string;
    /** 执行方法名称，如：keys, obj, print */
    method?: string;
    /** 执行方法归属名称，如：Object, obj  */
    ascription?: string;
}

export const enum MethodExecStatus {
    Executed = 1,
    Success = 2,
    Fail = 3
}

export interface MpMaterialCategoryMap<T> {
    [prop: string]: T[];
}

export const enum HookScope {
    App = 'App',
    Page = 'Page',
    Component = 'Component',
    Api = 'Api',
    Console = 'Console',
    AppMethod = 'AppMethod',
    PageMethod = 'PageMethod',
    ComponentMethod = 'ComponentMethod'
}
export const enum MpComponentMethodSeat {
    methods = 'methods',
    pageLifetimes = 'pageLifetimes',
    lifetimes = 'lifetimes',
    propObserver = 'propObserver',
    observers = 'observers'
}

export interface RequireId<T = string> {
    id: T;
}

export interface MpNameValue<V = any, T = string> {
    name: T;
    value?: V;
}

export interface MpInitiator {
    type: string;
    fileName?: string;
    method?: string;
    lineNumber?: number;
    column?: number;
}

export interface MpDetailKV extends MpNameValue<string | number> {
    decodedValue?: string | number;
    remark?: string;
}

export interface MpCookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
    maxAge?: number;
    size?: number;
    httpOnly?: boolean;
    secure?: boolean;
}

export interface MpSystemInfo {
    windowWidth: number;
    windowHeight: number;
    statusBarHeight?: number;
}
