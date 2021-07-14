export const enum JSONType {
    num = 'num',
    bigint = 'bigint',
    symbol = 'symbol',
    bool = 'bool',
    undefined = 'undefined',
    string = 'string',
    null = 'null',
    object = 'object',
    ellipsis = 'ellipsis',
    compute = 'compute',
    func = 'func'
}

export type JSONPropPath = Array<string | symbol>;

export interface JSONChunk<T = string> {
    type?: JSONType;
    leftBoundary?: string;
    rightBoundary?: string;
    remark?: string;
    className?: string;
    content?: T;
    /** 受保护的？ */
    protected?: boolean;
}

export interface JSONNode<T = any> extends JSONChunk<T> {
    node: true;
    type: JSONType;
    open?: boolean;
    // eslint-disable-next-line no-use-before-define
    tree?: JSONTree;
    empty?: boolean;
}
export interface JSONComma extends JSONChunk<string> {
    comma: true;
}
export interface JSONProp extends JSONChunk<string> {
    prop: true;
}
export interface JSONValue<T = any> extends JSONNode<T> {
    value: true;
    path?: JSONPropPath;
}
export interface JSONRow<T = any> {
    row: true;
    path: JSONPropPath;
    prop?: JSONProp;
    value?: JSONValue<T>;
    // eslint-disable-next-line no-use-before-define
    tree?: JSONTree;
}

export type MeasureTextHandler = (str: string, fontSize: number) => number;

export interface JSONViewerOptions<T = any> {
    fontSize: number;
    keyFontSize: number;
    maxWidth: number;
    target: T;
    arrowWidth: number;
    measureText: MeasureTextHandler;
}

export type GlobalObjectConstructorNames =
    | 'Number'
    | 'Object'
    | 'Array'
    | 'BigInt'
    | 'Boolean'
    | 'String'
    | 'Symbol'
    | 'Date'
    | 'Map'
    | 'Set';

export interface JSONWord {
    fontSize: number;
    word: string;
    width?: number;
}

export type JSONPropFilter = (prop: string | symbol, desc: PropertyDescriptor, index: number) => boolean;
export interface JSONPropDesc {
    prop: string | symbol;
    desc: PropertyDescriptor;
}

export type JSONItem = JSONChunk | JSONNode | JSONRow | JSONComma | JSONProp | JSONValue;
export type JSONMeasureTextHandler = (str: string | JSONItem, maxWidth?: number) => number;
export type JSONTree = Array<JSONRow>;

export interface IJSONViewer<T = any> {
    readonly options: JSONViewerOptions<T>;
    measureText: JSONMeasureTextHandler;
    replaceJSONPropPath: (path: JSONPropPath) => string[];
    restoreJSONPropPath: (path: string[]) => JSONPropPath;
    setTarget: (target?: any) => any;
    getPathPropWidth: (path?: JSONPropPath) => number;
    getWords: (str: string | JSONItem, maxWidth?: number, readyWidth?: number) => JSONWord[];
    getJSONNode: (path?: JSONPropPath, maxWidth?: number) => JSONNode;
    getJSONTree: (path?: JSONPropPath) => JSONTree;
}
