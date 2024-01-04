import type { AnyFunction, AnyObject } from './util';
import type { MpComponentLifeSpec, MpViewContext, MpWcViewContext } from './view';
export interface MpCanvasComponent {
    $wcCanvasContext: AnyObject;
    $wcCanvasContextResolves?: AnyFunction[];
}

export interface MpCanvasComponentMethods<C extends MpCanvasComponent = MpCanvasComponent> {
    $getCanvasContext: (this: C) => Promise<any>;
}

export type MpCanvasComponentContext = MpWcViewContext &
    MpCanvasComponent &
    MpCanvasComponentMethods<MpCanvasComponentContext> &
    MpViewContext;

export interface MpCanvasComponentSpec extends MpComponentLifeSpec<MpCanvasComponentContext> {
    methods: MpCanvasComponentMethods<MpCanvasComponentContext>;
}
