import { AnyFunction, AnyObject } from './util';
import { MpComponentLifeSpec, MpViewContext } from './view';
export interface MpCanvasComponent {
    $wcCanvasContext: AnyObject;
    $wcCanvasContextResolves?: AnyFunction[];
}

export interface MpCanvasComponentMethods<C extends MpCanvasComponent = MpCanvasComponent> {
    $getCanvasContext: (this: C) => Promise<any>;
}

export type MpCanvasComponentContext = MpCanvasComponent &
    MpCanvasComponentMethods<MpCanvasComponentContext> &
    MpViewContext;

export interface MpCanvasComponentSpec extends MpComponentLifeSpec<MpCanvasComponentContext> {
    methods: MpCanvasComponentMethods<MpCanvasComponentContext>;
}
