import { WeConsoleEvents } from '../../types/scope';
import { wcScope } from '../../modules/util';
import type { MpCanvasComponentSpec } from '../../types/canvas';
const WcScope = wcScope();

const Mixin: MpCanvasComponentSpec = {
    methods: {
        $getCanvasContext(): Promise<any> {
            if (this.$wcCanvasContext) {
                return Promise.resolve(this.$wcCanvasContext);
            }
            const ctx = WcScope.CanvasContext;
            if (ctx) {
                this.$wcCanvasContext = ctx;
                return Promise.resolve(this.$wcCanvasContext);
            }
            if (!this.$wcCanvasContextResolves) {
                this.$wcCanvasContextResolves = [];
            }
            return new Promise((resolve) => {
                this.$wcCanvasContextResolves.push(resolve);
            });
        }
    },
    created() {
        this.$wcOn(WeConsoleEvents.WcCanvasContextReady, (type, data) => {
            this.$wcCanvasContext = data;
            if (this.$wcCanvasContextResolves) {
                this.$wcCanvasContextResolves.forEach((item) => {
                    item?.();
                });
                delete this.$wcCanvasContextResolves;
            }
        });
        this.$wcOn(WeConsoleEvents.WcCanvasContextDestory, () => {
            delete this.$wcCanvasContext;
        });
    }
};
export default Mixin;
