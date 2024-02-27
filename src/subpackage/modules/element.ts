import { toHump, isApp, getMpViewType, getWcControlMpViewInstances } from '@/main/modules/util';
import type { MpAttrNode, MpElement } from '@/types/element';
import { uniq } from './util';
import {
    getCurrentAppId,
    getCurrentAppVersion,
    getCurrentEnvVersion,
    supportSelectOwnerComponent
} from 'cross-mp-power';

const getGroup = (children: MpElement[]): MpElement[] => {
    const map: { [prop: string]: MpElement } = {};
    const res: MpElement[] = [];
    children.forEach((item: MpElement) => {
        if (!map[item.name]) {
            const el: MpElement = {
                id: item.name,
                name: item.name,
                group: true,
                attrs: [
                    {
                        name: 'count',
                        content: '0'
                    },
                    {
                        name: 'is',
                        content: item.attrs?.find((it) => it.name === 'is')?.content
                    }
                ],
                children: []
            };
            res.push(el);
            map[item.name] = el;
        }
        const attrs = map[item.name].attrs;
        if (parseInt(attrs[0].content as string) < 1) {
            attrs[0].content = String(parseInt(attrs[0].content as string) + 1);
            map[item.name].children?.push(item);
        }
    });
    res.forEach((item, index) => {
        if (item.attrs?.[0].content === '1') {
            res[index] = (item.children as MpElement[])[0];
        } else {
            item.attrs?.shift();
        }
    });
    return res;
};

const isPage = (vm) => {
    // TODO: 适配多渠道与Component方式注册page的方式
    return getMpViewType(vm) === 'Page';
};

// 只有不支持selectOwnerComponent时才会调用此方法
const getPageAllChildren = (page): MpElement[] => {
    return getWcControlMpViewInstances().reduce((sum: MpElement[], item) => {
        if (item !== page && !isApp(item) && isPageChild(item, page)) {
            sum.push(getElement(item));
        }
        return sum;
    }, []);
};

export const getChildrenElements = (vw: any, group?: string): Promise<MpElement[]> => {
    const vwType = getMpViewType(vw);
    if (vwType === 'App') {
        const pages = getCurrentPages() as any[];
        if (!pages || !pages.length) {
            return Promise.resolve([]);
        }
        return Promise.all(pages.map((item) => getElement(item)));
    }
    if (vwType === 'Component' && !supportSelectOwnerComponent()) {
        return Promise.resolve([]);
    }
    if (isPage(vw) && !supportSelectOwnerComponent()) {
        return Promise.resolve(getPageAllChildren(vw));
    }
    const MpViewInstances = getWcControlMpViewInstances();
    const children = uniq(
        MpViewInstances.filter((item) => {
            if (group) {
                return item.is === group;
            }
            return item.selectOwnerComponent?.() === vw;
        })
    );
    return Promise.all(children.map((item) => getElement(item))).then((list) => {
        if (group) {
            return list;
        }
        return getGroup(list);
    });
};

export const getElement = (vw: any): MpElement => {
    const attrs = getElementAttrs(vw);
    const tagAttr = attrs.find((item) => item.name === 'tag') as MpAttrNode;
    const idAttr = attrs.find((item) => item.name === 'id') as MpAttrNode;
    const el: MpElement = {
        id: idAttr.content as string,
        name: tagAttr.content as string,
        attrs: attrs.length > 1 ? attrs.slice(1) : [],
        hasChild: tagAttr.content === 'App' ? true : hasChild(vw)
    };
    if (tagAttr.content === 'Component') {
        const componentPath = attrs.find((item) => item.name === 'is')?.content;
        const paths = componentPath?.split('/') || [];
        let name = toHump(
            paths[paths.length - 1] === 'index'
                ? paths[paths.length > 1 ? paths.length - 2 : 0]
                : paths[paths.length - 1]
        );
        if (name[0].toUpperCase() !== name[0]) {
            name = name[0].toUpperCase() + name.substr(1);
        }
        if (paths.length > 1 && paths[paths.length - 1] !== 'index') {
            let temp = toHump(paths[paths.length - 2]);
            if (temp[0].toUpperCase() !== temp[0]) {
                temp = temp[0].toUpperCase() + temp.substr(1);
            }
            if (temp !== name) {
                name = temp + name;
            }
        }

        el.name = name;
    }
    return el;
};

const isPageChild = (component: any, page: any): boolean => {
    if (BUILD_TARGET === 'qq') {
        return component.__wxWebviewId__ && page.__wxWebviewId__ && component.__wxWebviewId__ === page.__wxWebviewId__;
    }
    return false;
};

export const hasChild = (vw: any): boolean => {
    const MpViewInstances = getWcControlMpViewInstances();
    if (supportSelectOwnerComponent()) {
        return MpViewInstances.some((item) => item.selectOwnerComponent?.() === vw);
    }
    if (isPage(vw)) {
        return MpViewInstances.some((item) => isPageChild(item, vw));
    }
    return false;
};

export const getElementId = (vm: any): string => {
    if (BUILD_TARGET === 'wx' || BUILD_TARGET === 'qq') {
        return vm.__wxExparserNodeId__;
    }
    if (BUILD_TARGET === 'my') {
        return vm.$id;
    }
    // TODO: 其他渠道
    return '';
};

export const getElementLabel = (vm: any): string => {
    if (BUILD_TARGET === 'wx' || BUILD_TARGET === 'qq' || BUILD_TARGET === 'my') {
        return vm.is || vm.route || vm.__route__;
    }
    return '';
};

const getAppAttrs = () => {
    const attrs: MpAttrNode[] = [];
    attrs.push({
        name: 'tag',
        content: 'App'
    });
    attrs.push({
        name: 'id',
        content: getCurrentAppId()
    });
    attrs.push({
        name: 'env',
        content: getCurrentEnvVersion()
    });
    attrs.push({
        name: 'version',
        content: getCurrentAppVersion()
    });
    return attrs;
};

export const getElementAttrs = (vw: any): MpAttrNode[] => {
    if (isApp(vw)) {
        return getAppAttrs();
    }
    const attrs: MpAttrNode[] = [];
    const tagName = getMpViewType(vw);
    attrs.push({
        name: 'tag',
        content: tagName
    });
    attrs.push({
        name: 'id',
        content: getElementId(vw)
    });
    attrs.push({
        name: 'is',
        content: getElementLabel(vw)
    });
    return attrs;
};

export const findPageIns = (id: string): any => {
    return findComponentIns(id);
};
export const findComponentIns = (id: string): any => {
    return getWcControlMpViewInstances().find((item) => getElementId(item) === id);
};
