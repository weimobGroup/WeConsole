import { ToolMixin } from '@/sub/mixins/tool';
import { registerClassComponent } from '@/sub/mixins/component';
import type { MpComponentEvent, MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';

interface Props {
    tabs: string[];
    size: 'normal' | 'small';
    active: number;
    outerClass: string;
    headScroll: boolean;
    bodyFill: boolean;
    direction: 'horizontal' | 'vertical';
    position: 'top' | 'left';
}

interface Data {
    toView: string;
}

class Tabs extends MpComponent {
    $mx = {
        Tool: new ToolMixin<Data>()
    };
    options = {
        multipleSlots: true
    };
    properties: MpComponentProperties<Props, Tabs> = {
        tabs: {
            type: Array
        },
        size: {
            type: String,
            value: 'normal'
        },
        active: {
            type: Number,
            observer(val) {
                this.$mx.Tool.$forceData({
                    toView: `tabTitle_${val}`
                });
            }
        },
        outerClass: String,
        headScroll: {
            type: Boolean,
            value: true
        },
        bodyFill: {
            type: Boolean,
            value: true
        },
        direction: {
            type: String,
            value: 'horizontal' // horizontal, vertical
        },
        position: {
            type: String,
            value: 'top' // top,left
        }
    };
    initData: Data = { toView: '' };
    tapTab(e: MpComponentEvent) {
        const index = parseInt(e.currentTarget.dataset.tab);
        this.triggerEvent('change', index);
        setTimeout(() => {
            if (index === parseInt(this.data.active)) {
                this.$mx.Tool.$forceData({
                    toView: `tabTitle_${index}`
                });
            }
        });
    }
}

registerClassComponent(Tabs);
