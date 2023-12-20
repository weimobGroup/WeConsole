import { WeComponent } from '../mixins/component';
import type { MpViewContext, MpViewContextAny } from '../../types/view';
WeComponent<MpViewContext & MpViewContextAny>({
    properties: {
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
    },
    methods: {
        onFilterConfirm(e) {
            const text = e.detail.value;
            this.triggerEvent('filter', text);
        },
        onClear() {
            this.triggerEvent('clear');
        },
        onRemove() {
            this.triggerEvent('remove');
        },
        onRefresh() {
            this.triggerEvent('refresh');
        },
        tapCategory(e) {
            this.triggerEvent('category', e.currentTarget.dataset.val);
        }
    }
});
