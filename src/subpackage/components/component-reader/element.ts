import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { registerClassComponent } from '@/sub/mixins/component';

interface Props {
    data: {
        open: boolean;
        path: string;
        id: string;
    };
    selectId: string;
}

interface Data {
    l: string;
    l2: string;
    r: string;
    r2: string;
}

class ComponentReaderElement extends MpComponent {
    properties: MpComponentProperties<Props, ComponentReaderElement> = {
        data: Object,
        selectId: String
    };
    initData: Data = {
        l: '<',
        l2: '</',
        r: '>',
        r2: '/>'
    };

    tap() {
        this.triggerEvent('toggle', {
            open: !this.data.data.open,
            path: this.data.data.path,
            id: this.data.data.id
        });
    }
    tapName() {
        this.triggerEvent('tapName', {
            path: this.data.data.path,
            id: this.data.data.id
        });
    }
    childTapName(e) {
        this.triggerEvent('tapName', e.detail);
    }
    toggle(e) {
        this.triggerEvent('toggle', e.detail);
    }
}

registerClassComponent(ComponentReaderElement);
