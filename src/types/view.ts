export interface MpClientRect {
    width: number;
    height: number;
    top: number;
    left: number;
}

export interface MpShowActionSheetOptions {
    itemList: string[];
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
