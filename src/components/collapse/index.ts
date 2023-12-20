import type { MpViewContext, MpViewContextAny } from '../../types/view';
import { WeComponent } from '../mixins/component';
WeComponent<MpViewContext & MpViewContextAny>({
    options: {
        multipleSlots: true
    },
    properties: {
        open: {
            type: Boolean,
            observer(val) {
                this.updateData({
                    innerOpen: val
                });
            }
        },
        inner: {
            type: Boolean,
            value: true
        },
        title: String,
        border: {
            type: Boolean,
            value: true
        }
    },
    data: {
        innerOpen: false
    },
    methods: {
        toggle() {
            this.triggerEvent('toggle');
            this.updateData({
                innerOpen: !this.data.innerOpen
            });
        }
    }
});
