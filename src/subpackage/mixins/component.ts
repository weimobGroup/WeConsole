import type { MpComponent } from 'typescript-mp-component';
import { toMpComponentConfig } from 'typescript-mp-component';
import { makeSureCreatedPriorPropObserver } from './no-wx';
import { rewriteAliSpec } from './ali';

export const registerClassComponent = (constructor: new () => MpComponent) => {
    registerComponent(toMpComponentConfig(constructor));
};

export const registerComponent = (spec: any) => {
    spec.$wcDisabled = true;
    if (BUILD_TARGET !== 'wx') {
        makeSureCreatedPriorPropObserver(spec);
    }
    if (BUILD_TARGET === 'my') {
        rewriteAliSpec(spec);
    }
    Component(spec);
};
