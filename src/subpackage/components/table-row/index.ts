import { registerComponent } from '@/sub/mixins/component';
import type { RequireId } from '@/types/common';
import type { TableRowComponentData, TableRowComponentProps } from '@/types/table';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';

class TableRowComponent<T extends RequireId = RequireId> extends MpComponent<
    TableRowComponentData,
    TableRowComponentProps<T>
> {
    properties: MpComponentProperties<TableRowComponentProps<T>, TableRowComponent<T>> = {
        value: {
            type: Object,
            observer() {
                this.computeIsSelected();
            }
        },
        maxIndex: Number,
        index: Number,
        state: {
            type: Object,
            observer() {
                this.computeIsSelected();
            }
        },
        direction: String,
        scope: String
    };

    initData: TableRowComponentData = {
        isSelected: false
    };

    attached() {
        this.computeIsSelected();
    }

    computeIsSelected() {
        this.setData({
            isSelected: !!this.data.state.selected?.includes(this.data.value?.id)
        });
    }

    emitInteractEvent(type: string, e: MpEvent) {
        const id = this.data.value.id;
        this.triggerEvent('interact', {
            type: type,
            id,
            detail: {
                type: e.currentTarget.dataset.type,
                colIndex: e.currentTarget.dataset.col ? parseInt(String(e.currentTarget.dataset.col)) : -1
            }
        });
    }

    tapRow(e: MpEvent) {
        this.emitInteractEvent('tapRow', e);
    }
    longpressRow(e: MpEvent) {
        this.emitInteractEvent('longpressRow', e);
    }

    tapCell(e: MpEvent) {
        this.emitInteractEvent('tapCell', e);
    }
    longpressCell(e: MpEvent) {
        this.emitInteractEvent('longpressCell', e);
    }
}

registerComponent(TableRowComponent);
