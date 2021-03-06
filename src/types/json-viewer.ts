import { MpCanvasComponent, MpCanvasComponentMethods } from './canvas';
import { MpNameValue } from './common';
import { IJSONViewer, JSONChunk, JSONNode, JSONPropPath } from './json';
import { MpComponentLifeSpec, MpComponentProperties, MpEvent, MpViewContext } from './view';

export const enum MpJSONViewerComponentMode {
    full = 1,
    tree = 2,
    string = 3
}

export interface MpJSONViewerComponentData {
    root: JSONNode | JSONChunk;
    JSONString?: string;
    activeTab?: 0 | 1;
    tabs: MpNameValue<MpJSONViewerComponentMode, string>[];
}
export interface MpJSONViewerComponentProps {
    target: any;
    from: string;
    json: any;
    init: boolean;
    mode: MpJSONViewerComponentMode;
    fontSize: number;
    smallFontSize: number;
}
export interface MpJSONViewerComponentEventDetail {
    path: string[];
    open: boolean;
    fromCompute?: boolean;
}
export interface MpJSONViewerComponentMethods<T> {
    syncFontSize: (this: T) => void;
    buildComputeObject: (this: T, path: JSONPropPath) => void;
    rpxToPx: (this: T, rpx: number) => number;
    onInited: (this: T, func: Function) => void;
    changeTab: (this: T, e: MpEvent<any>) => void;
    toggle: (this: T, e: MpEvent<MpJSONViewerComponentEventDetail>) => void;
    init: (this: T) => Promise<any>;
    openPath: (this: T, path?: JSONPropPath) => void;
    closePath: (this: T, path?: JSONPropPath) => void;
    buildPath: (this: T, open: boolean, path?: JSONPropPath) => any;
    setPathVisable: (this: T, open: boolean, path?: JSONPropPath) => void;
    setTarget: (this: T, target?: any, updateUI?: boolean) => void;
    initJSONViewer: (this: T, from?: string) => Promise<any>;
    setJSONString: (this: T, target?: any) => Promise<any>;
    measureText: (this: T, str: string, fontSize: number) => number;
}

export interface MpJSONViewerComponent
    extends MpViewContext<MpJSONViewerComponentData & MpJSONViewerComponentProps>,
        MpJSONViewerComponentMethods<MpJSONViewerComponent>,
        MpCanvasComponent,
        MpCanvasComponentMethods<MpJSONViewerComponent> {
    inited: boolean;
    JSONViewer?: IJSONViewer;
    target: any;
    windowWidth: number;
    onInitedHandlers?: Function[];
    lastPath?: JSONPropPath;
    lastOpen?: boolean;
}

export interface MpJSONViewerComponentEbusDetail {
    from: string;
    viewer: MpJSONViewerComponent;
}

export interface MpJSONViewerComponentSpec extends MpComponentLifeSpec<MpJSONViewerComponent> {
    options?: any;
    properties: MpComponentProperties<MpJSONViewerComponent>;
    data?: Partial<MpJSONViewerComponentData>;
    methods: Partial<MpJSONViewerComponentMethods<MpJSONViewerComponent>>;
}
