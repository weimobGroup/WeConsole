import { wcScopeSingle } from '../../modules/util';
import { MpComponentSpec } from '../../types/view';
function OnProduct(type, data) {
    this && this.onWcProduct && this.onWcProduct(type, data);
}
const spec: MpComponentSpec = {
    created() {
        Object.defineProperty(this, '$wcProductController', {
            get() {
                return wcScopeSingle('ProductController');
            }
        });
        if (this.$wcProductController) {
            this.$wcProductControllerHnalder = OnProduct.bind(this);
            this.$wcProductController.on('create', this.$wcProductControllerHnalder);
            this.$wcProductController.on('change', this.$wcProductControllerHnalder);
        }
    },
    detached() {
        if (this.$wcProductController && this.$wcProductControllerHnalder) {
            this.$wcProductController.off('create', this.$wcProductControllerHnalder);
            this.$wcProductController.off('change', this.$wcProductControllerHnalder);
        }
    }
};

export default spec;
