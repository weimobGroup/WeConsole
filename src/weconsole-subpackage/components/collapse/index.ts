import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { registerComponent } from '@/sub/mixins/component';

interface Props {
    open: boolean;
    inner: boolean;
    title: string;
    border: boolean;
}

class Collapse extends MpComponent<{ innerOpen: boolean }, Props, Collapse> {
    $mx = {
        Tool: new ToolMixin()
    };
    options = {
        multipleSlots: true
    };
    properties: MpComponentProperties<Props, Collapse> = {
        open: {
            type: Boolean,
            observer(val) {
                this.$mx.Tool.$updateData({
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
    };
    initData = {
        innerOpen: false
    };
    toggle() {
        this.triggerEvent('toggle');
        this.$mx.Tool.$updateData({
            innerOpen: !this.data.innerOpen
        });
    }
}

registerComponent(Collapse);
