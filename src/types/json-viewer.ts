import type { MpNameValue } from './common';
import type { JSONChunk, JSONNode } from './json';

export const enum MpJSONViewerComponentMode {
    full = 1,
    tree = 2,
    string = 3
}

export interface MpJSONViewerComponentData {
    root: JSONNode | JSONChunk | null;
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
    outerClass: string;
    title?: string;
}
export interface MpJSONViewerComponentEventDetail {
    path: string[];
    open: boolean;
    fromCompute?: boolean;
}
