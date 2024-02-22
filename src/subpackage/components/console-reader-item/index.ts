import { registerComponent } from '@/sub/mixins/component';
import type { MpConsoleMaterial } from '@/types/product';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import type { MpVirtualListItemComponentProps } from '@cross-virtual-list/types';

type Props = MpVirtualListItemComponentProps<MpConsoleMaterial, { from: string; type?: string; selectRowId: string }>;

class ConsoleReaderItemComponent extends MpComponent {
    properties: MpComponentProperties<Props, ConsoleReaderItemComponent> = {
        value: {
            type: Object
        },
        maxIndex: Number,
        index: Number,
        state: Object,
        direction: String,
        scope: String
    };

    emitInteractEvent(type: string, detail?: any) {
        const id = this.data.value.id;
        this.triggerEvent('interact', {
            type: type,
            id,
            detail
        });
    }

    tapRow() {
        this.emitInteractEvent('tapRow');
    }

    longpressRow() {
        this.emitInteractEvent('longpressRow');
    }

    rowJSONViewerToggle(e: MpEvent) {
        this.emitInteractEvent('rowJSONViewerToggle', {
            index: parseInt(String(e.currentTarget.dataset.index)),
            ...(e.detail || {})
        });
    }
}

registerComponent(ConsoleReaderItemComponent);
