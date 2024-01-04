import { wcScopeSingle } from '../../config';
import type { MpComponentSpec, MpWcViewContext } from '../../types/view';
function OnProduct(type, data) {
    this && this.onWcProduct && this.onWcProduct(type, data);
}
const spec: MpComponentSpec<MpWcViewContext> = {
    created() {
        Object.defineProperty(this, '$wcProductController', {
            get() {
                return wcScopeSingle('ProductController');
            }
        });
        if (this.$wcProductController) {
            this.$wcProductControllerHandler = OnProduct.bind(this);
            this.$wcProductController.on('create', this.$wcProductControllerHandler);
            this.$wcProductController.on('change', this.$wcProductControllerHandler);
        }
    },
    detached() {
        if (this.$wcProductController && this.$wcProductControllerHandler) {
            this.$wcProductController.off('create', this.$wcProductControllerHandler);
            this.$wcProductController.off('change', this.$wcProductControllerHandler);
        }
    }
};

export default spec;
