import { registerComponent } from '@/sub/mixins/component';
import type { TableCellComponentProps } from '@/types/table';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';

class TableCellComponent<T = any> extends MpComponent {
    properties: MpComponentProperties<TableCellComponentProps, TableCellComponent<T>> = {
        value: {
            type: null
        },
        from: String
    };
}

registerComponent(TableCellComponent);
