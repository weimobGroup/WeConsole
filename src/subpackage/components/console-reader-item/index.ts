import { registerComponent } from '@/sub/mixins/component';
import type { MpConsoleMaterial } from '@/types/product';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';

interface ConsoleReaderItemComponentProps {
    value: MpConsoleMaterial;
    index: number;
    maxIndex: number;
    direction: 'x' | 'y';
    state: { from: string };
}

class ConsoleReaderItemComponent extends MpComponent {
    properties: MpComponentProperties<ConsoleReaderItemComponentProps, ConsoleReaderItemComponent> = {
        value: {
            type: Object
        },
        maxIndex: Number,
        index: Number,
        state: Object,
        direction: String
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
