import { WeComponent } from '../mixins/component';

WeComponent({
    properties: {
        data: {
            type: null
        },
        selectId: String
    },
    methods: {
        tap() {
            this.triggerEvent('toggle', {
                open: !this.data.data.open,
                path: this.data.data.path,
                id: this.data.data.id
            });
        },
        tapName() {
            this.triggerEvent('tapName', {
                path: this.data.data.path,
                id: this.data.data.id
            });
        },
        childTapName(e) {
            this.triggerEvent('tapName', e.detail);
        },
        toggle(e) {
            this.triggerEvent('toggle', e.detail);
        }
    }
});
