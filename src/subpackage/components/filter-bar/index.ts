import type { MpComponentEvent, MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { registerClassComponent } from '@/sub/mixins/component';

interface Props {
    filter: boolean;
    refresh: boolean;
    filterPlaceholder: string;
    remove: boolean;
    clear: boolean;
    activeCategory: string;
    categorys: string[];
}

class FilterBar extends MpComponent {
    properties: MpComponentProperties<Props, FilterBar> = {
        filter: {
            type: Boolean,
            value: true
        },
        refresh: {
            type: Boolean,
            value: false
        },
        filterPlaceholder: {
            type: String,
            value: 'Filter'
        },
        remove: {
            type: Boolean,
            value: false
        },
        clear: {
            type: Boolean,
            value: false
        },
        activeCategory: String,
        categorys: Array
    };
    onFilterConfirm(e: Required<MpComponentEvent<{ value: string }>>) {
        const text = e.detail.value;
        this.triggerEvent('filter', text);
    }
    onClear() {
        this.triggerEvent('clear');
    }
    onRemove() {
        this.triggerEvent('remove');
    }
    onRefresh() {
        this.triggerEvent('refresh');
    }
    tapCategory(e: MpComponentEvent) {
        if (this.data.activeCategory === e.currentTarget.dataset.val) {
            return;
        }
        this.triggerEvent('category', e.currentTarget.dataset.val);
    }
}

registerClassComponent(FilterBar);
