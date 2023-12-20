import { wcScope, wcScopeSingle } from '../../modules/util';
import { ReaderStateController } from '../modules/reader-state';
import { MpApiCategoryMap, reportCategoryMapToList } from '../modules/category';
import type { MpProduct } from '../../types/product';
import type { MpUIConfig } from '../../types/config';

const WcScope = wcScope();
export const MainStateController = wcScopeSingle(
    'MainStateController',
    () => new ReaderStateController('Main')
) as ReaderStateController;
wcScopeSingle('ApiStateController', () => new ReaderStateController('Api', () => wcScopeSingle('ProductController')));
wcScopeSingle(
    'ConsoleStateController',
    () => new ReaderStateController('Console', () => wcScopeSingle('ProductController'))
);

if (!WcScope.UIConfig) {
    WcScope.UIConfig = {};
}

const defaultConfig: MpUIConfig = {
    apiCategoryGetter(product: MpProduct): string {
        if ((product.category || '').startsWith('cloud')) {
            return 'cloud';
        }
        return MpApiCategoryMap[product.category] || 'other';
    },
    apiCategoryList: reportCategoryMapToList(MpApiCategoryMap)
};
for (const prop in defaultConfig) {
    if (!WcScope.UIConfig[prop]) {
        WcScope.UIConfig[prop] = defaultConfig[prop];
    }
}

const apiState = wcScopeSingle('ApiStateController') as ReaderStateController;
if (WcScope.UIConfig.apiDefaultCategoryValue) {
    apiState.setState('activeCategory', WcScope.UIConfig.apiDefaultCategoryValue);
}
const consoleState = wcScopeSingle('ConsoleStateController') as ReaderStateController;
if (WcScope.UIConfig.consoleDefaultCategoryValue) {
    consoleState.setState('activeCategory', WcScope.UIConfig.consoleDefaultCategoryValue);
}
