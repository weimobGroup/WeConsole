import type { IMpProductController } from '@/types/hook';
import { getUIConfig, wcScopeSingle } from '../config';
import { ReaderStateController } from './reader-state';

export const MainStateController = wcScopeSingle(
    'MainStateController',
    () => new ReaderStateController('Main')
) as ReaderStateController;

export const ApiStateController = wcScopeSingle(
    'ApiStateController',
    () => new ReaderStateController('Api', () => wcScopeSingle('ProductController') as IMpProductController)
) as ReaderStateController;

export const ConsoleStateController = wcScopeSingle(
    'ConsoleStateController',
    () => new ReaderStateController('Console', () => wcScopeSingle('ProductController') as IMpProductController)
) as ReaderStateController;

// 选中默认分类
const apiState = ApiStateController;
if (getUIConfig().apiDefaultCategoryValue) {
    apiState.setState('activeCategory', getUIConfig().apiDefaultCategoryValue);
}
const consoleState = ConsoleStateController;
if (getUIConfig().consoleDefaultCategoryValue) {
    consoleState.setState('activeCategory', getUIConfig().consoleDefaultCategoryValue);
}
