import { registerClassComponent } from '@/sub/mixins/component';
import type { RequireId } from '@/types/common';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import type { MpVirtualListItemComponentProps } from '@cross-virtual-list/types';

class VlItemComponent<T extends RequireId = RequireId> extends MpComponent<
    NonNullable<unknown>,
    MpVirtualListItemComponentProps<T>
> {
    properties: MpComponentProperties<MpVirtualListItemComponentProps<T>, VlItemComponent<T>> = {
        value: Object,
        maxIndex: Number,
        index: Number,
        state: Object,
        direction: String,
        scope: String
    };

    emitInteract(e) {
        this.triggerEvent('interact', e.detail);
    }
}

registerClassComponent(VlItemComponent);
