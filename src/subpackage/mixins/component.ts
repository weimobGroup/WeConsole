import type { MpComponent } from 'typescript-mp-component';
import { toMpComponentConfig } from 'typescript-mp-component';

export const registerClassComponent = (constructor: new () => MpComponent) => {
    registerComponent(toMpComponentConfig(constructor));
};

export const registerComponent = (spec: any) => {
    spec.$wcDisabled = true;
    Component(spec);
};
