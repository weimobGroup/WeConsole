import { DataGridCol } from './data-grid';
import { IEventEmitter } from './util';

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
    /** 按钮文案 */
    button?: string;
    /** 执行逻辑 */
    handler: Function;
    /** 显示方式 */
    showMode?: WcCustomActionShowMode;
}

export interface WcCustomActionGrid {
    cols: DataGridCol[];
    data: any;
}

export interface WcCustomActionComponent {
    name: string;
    data?: any;
}

export interface WcCustomActionUpdateGrid extends IEventEmitter {
    cols: DataGridCol[];
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
