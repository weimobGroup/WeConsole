import { getUIConfig } from '@/main/config';
import { getSystemInfo } from 'cross-mp-power';
import type { WcCustomAction } from '@/types/other';
import { WcCustomActionShowMode } from '@/types/other';

export const SystemInfoCustomAction: WcCustomAction = {
    id: 'NativeInfo',
    title: '内置信息',
    autoCase: 'SystemInfo',
    cases: [
        {
            id: 'SystemInfo',
            button: '系统信息',
            showMode: WcCustomActionShowMode.json,
            handler(): Promise<any> {
                return Promise.resolve(getSystemInfo());
            }
        },
        {
            id: 'Global',
            button: 'Global对象',
            showMode: WcCustomActionShowMode.json,
            handler(): any {
                return typeof global !== 'undefined' ? global : undefined;
            }
        },
        {
            id: 'App',
            button: 'App对象',
            showMode: WcCustomActionShowMode.json,
            handler(): any {
                if (BUILD_TARGET === 'wx') {
                    return getApp({ allowDefault: true });
                }
                return getApp();
            }
        },
        {
            id: 'CurrentPage',
            button: '当前页面实例',
            showMode: WcCustomActionShowMode.json,
            handler(): any {
                const pages = getCurrentPages();
                return getUIConfig().currentPageGetter?.() || pages?.[pages.length - 1];
            }
        }
    ]
};
const demoActions = [
    // {
    //     id: "test1",
    //     title: "显示文本",
    //     autoCase: "show",
    //     cases: [
    //         {
    //             id: "show",
    //             button: "查看",
    //             showMode: WcCustomActionShowMode.text,
    //             handler(): string {
    //                 return "测试文本";
    //             },
    //         },
    //         {
    //             id: "show2",
    //             button: "查看2",
    //             showMode: WcCustomActionShowMode.text,
    //             handler(): string {
    //                 return "测试文本2";
    //             },
    //         },
    //     ],
    // },
    // {
    //     id: "test2",
    //     title: "显示JSON",
    //     autoCase: "show",
    //     cases: [
    //         {
    //             id: "show",
    //             button: "查看",
    //             showMode: WcCustomActionShowMode.json,
    //             handler() {
    //                 return wx;
    //             },
    //         },
    //     ],
    // },
    // {
    //     id: "test3",
    //     title: "显示表格",
    //     autoCase: "show",
    //     cases: [
    //         {
    //             id: "show",
    //             button: "查看",
    //             showMode: WcCustomActionShowMode.grid,
    //             handler(): WcCustomActionGrid {
    //                 return {
    //                     cols: [
    //                         {
    //                             title: "Id",
    //                             field: "id",
    //                             width: 30,
    //                         },
    //                         {
    //                             title: "Name",
    //                             field: "name",
    //                             width: 70,
    //                         },
    //                     ],
    //                     data: [
    //                         {
    //                             id: 1,
    //                             name: "Tom",
    //                         },
    //                         {
    //                             id: 2,
    //                             name: "Alice",
    //                         },
    //                     ],
    //                 };
    //             },
    //         },
    //     ],
    // },
];
export const getCustomActions = (): WcCustomAction[] => {
    const res: WcCustomAction[] = [SystemInfoCustomAction, ...demoActions];
    const config = getUIConfig();
    if (config?.customActions && config.customActions.length) {
        return res.concat(config.customActions);
    }
    return res;
};
