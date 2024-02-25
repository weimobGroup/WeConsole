import { registerClassComponent } from '@/sub/mixins/component';
import type { TableCellComponentProps } from '@/types/table';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';

class TableCellComponent<T = any> extends MpComponent {
    properties: MpComponentProperties<TableCellComponentProps, TableCellComponent<T>> = {
        value: Object,
        from: String
    };
    onJSONViewerToggle(e: MpEvent) {
        this.triggerEvent('onJSONViewerToggle', {
            ...e.detail,
            blockIndex: parseInt(e.currentTarget.dataset.block),
            jsonItemIndex: parseInt(e.currentTarget.dataset.index)
        });
    }
}

registerClassComponent(TableCellComponent);
