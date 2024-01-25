import type { MpComponent } from 'typescript-mp-component';
import { toMpComponentConfig } from 'typescript-mp-component';

export const registerComponent = (constructor: new () => MpComponent) => {
    const spec = toMpComponentConfig(constructor);
    spec.$wcDisabled = true;
    Component(spec);
};
