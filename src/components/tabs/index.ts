import { WeComponent } from '../mixins/component';
WeComponent({
    options: {
        multipleSlots: true
    },
    properties: {
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
                this.setData({
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
    },
    data: {
        toView: ''
    },
    methods: {
        tapTab(e) {
            const index = parseInt(e.currentTarget.dataset.tab);
            this.triggerEvent('change', index);
            setTimeout(() => {
                if (index === parseInt(this.data.active)) {
                    this.setData({
                        toView: `tabTitle_${index}`
                    });
                }
            });
        }
    }
});
