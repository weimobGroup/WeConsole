import type { HookScope, MethodExecStatus, MpCookie, MpDetailKV, MpStackInfo, RequireId } from './common';
import type { TableCell } from './table';

export interface MpProduct {
    id: string;
    /** 大类 */
    type: HookScope;
    /** 小类 */
    category?: string;
    request?: any[];
    time: number;
    status: MethodExecStatus;
    endTime?: number;
    response?: any[];
    execEndTime?: number;
    result?: any;
    eventTriggerPid?: string;
    eventHandlePid?: string;
    eventTriggerView?: any;
    stack?: MpStackInfo[];
}

export interface MpMaterial extends RequireId {
    /** 分类 */
    categorys?: string[];
    /** 索引字符串，可用于搜索 */
    indexs?: string[];
}

export interface MpApiMaterial extends MpMaterial {
    code?: number | string;
    name?: string | TableCell;
    category?: string;
    method?: string;
    nameDesc?: string;
    status: string | TableCell;
    statusDesc?: string;
    startTime?: number;
    endTime?: number;
    time?: TableCell;
    initiator?: string;
    initiatorDesc?: string;
    rowStyle?: string;
}

export interface MpConsoleMaterialItem {
    type: 'str' | 'nail' | 'num' | 'fun' | 'bool' | 'json' | 'br' | 'division';
    index: number;
    content?: string;
}

export interface MpConsoleMaterial extends MpMaterial {
    items?: MpConsoleMaterialItem[];
    method: string;
}

export interface MpApiDetail {
    id: string;
    general: MpDetailKV[];
    requestHeaders?: MpDetailKV[];
    responseHeaders?: MpDetailKV[];
    queryString?: string;
    queryStringParameters?: MpDetailKV[];
    formData?: MpDetailKV[];
    cookies?: MpCookie[];
    stack?: MpDetailKV[];
    originalRequestData?: any;
    response?: string;
    // arguments
    // requestRayload
}

export interface MpStorageMaterial extends MpMaterial {
    key: string;
    value: any;
}
