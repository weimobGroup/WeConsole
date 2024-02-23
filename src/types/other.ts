import type { DynamicTableComponentExports, RegularTableComponentExports, TableCol } from './table';
import type { AnyFunction } from './util';

/** 定制化 */

export const enum WcCustomActionShowMode {
    /** 显示JSON树 */
    json = 'json',
    /** 显示数据表格 */
    grid = 'grid',
    /** 固定显示<weconsole-customer>组件，该组件需要在app.json中注册，同时需要支持传入data属性，属性值就是case handler执行后的结果 */
    component = 'component',
    /** 显示一段文本 */
    text = 'text',
    /** 什么都不做 */
    none = 'none'
}

export interface WcCustomActionCase {
    id: string;
    title?: string;
    /** 按钮文案 */
    button?: string;
    /** 执行逻辑 */
    handler: AnyFunction;
    /** 显示方式 */
    showMode?: WcCustomActionShowMode;
}

export interface WcCustomActionGrid<T = any> {
    /** 列配置 */
    cols: TableCol[];
    /** 行数据唯一key字段名 */
    rowKeyField?: string;
    /** 行高，rowHeightMode=dynamic时代表最小行高 */
    rowHeight: number;
    /** 行高模式：
     * regular=固定高度；
     * dynamic=动态高度；
     */
    rowHeightMode: 'regular' | 'dynamic';
    /** 列最小宽度，单位：% */
    colMinWidth: number;
    /** 完全自主控制数据的设置等 */
    autonomy?: boolean;
    data?: T[];
    onReady?: (grid: RegularTableComponentExports<T> | DynamicTableComponentExports<T>) => void;
}

export interface WcCustomActionComponent {
    name: string;
    data?: any;
}

export interface WcCustomAction {
    /** 标识，需要保持唯一 */
    id: string;
    /** 标题 */
    title?: string;
    /** 默认执行哪个case？ */
    autoCase?: string;
    /** 该定制化有哪些情况 */
    cases: WcCustomActionCase[];
}
