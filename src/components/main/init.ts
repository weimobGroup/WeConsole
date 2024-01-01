import { getUIConfig, setUIConfig, wcScopeSingle } from '../../config';
import { ReaderStateController } from '../modules/reader-state';
import { MpApiCategoryMap, reportCategoryMapToList } from '../modules/category';
import type { MpProduct } from '../../types/product';
import type { MpUIConfig } from '../../types/config';

export const MainStateController = wcScopeSingle(
    'MainStateController',
    () => new ReaderStateController('Main')
) as ReaderStateController;
wcScopeSingle('ApiStateController', () => new ReaderStateController('Api', () => wcScopeSingle('ProductController')));
wcScopeSingle(
    'ConsoleStateController',
    () => new ReaderStateController('Console', () => wcScopeSingle('ProductController'))
);

const defaultConfig: MpUIConfig = {
    apiCategoryGetter(product: MpProduct): string {
        if ((product.category || '').startsWith('cloud')) {
            return 'cloud';
        }
        return MpApiCategoryMap[product.category] || 'other';
    },
    apiCategoryList: reportCategoryMapToList(MpApiCategoryMap)
};

setUIConfig(defaultConfig);

const apiState = wcScopeSingle('ApiStateController') as ReaderStateController;
if (getUIConfig().apiDefaultCategoryValue) {
    apiState.setState('activeCategory', getUIConfig().apiDefaultCategoryValue);
}
const consoleState = wcScopeSingle('ConsoleStateController') as ReaderStateController;
if (getUIConfig().consoleDefaultCategoryValue) {
    consoleState.setState('activeCategory', getUIConfig().consoleDefaultCategoryValue);
}
