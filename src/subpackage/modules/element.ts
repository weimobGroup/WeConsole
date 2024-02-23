import { toHump, isApp, getMpViewType, getWcControlMpViewInstances } from '@/main/modules/util';
import type { MpAttrNode, MpElement } from '@/types/element';
import { uniq } from './util';
import { getCurrentAppId, getCurrentAppVersion, getCurrentEnvVersion } from '@/main/modules/cross';

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
        const attrs = map[item.name].attrs as MpAttrNode[];
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

export const getChildrenElements = (vw: any, group?: string): Promise<MpElement[]> => {
    if (isApp(vw)) {
        const pages = getCurrentPages() as any[];
        if (!pages || !pages.length) {
            return Promise.resolve([]);
        }
        return Promise.all(pages.map((item) => getElement(item)));
    }
    const MpViewInstances = getWcControlMpViewInstances();
    const children = uniq(
        MpViewInstances.filter((item) => {
            if (group) {
                return item.is === group;
            }
            return item.selectOwnerComponent() === vw;
        })
    );
    return Promise.all(children.map((item) => getElement(item))).then((list) => {
        if (group) {
            return list;
        }
        return getGroup(list);
    });
};

export const getElement = (vw: any): Promise<MpElement> => {
    return getElementAttrs(vw).then((attrs) => {
        const tagAttr = attrs.find((item) => item.name === 'tag') as MpAttrNode;
        const idAttr = attrs.find((item) => item.name === 'id') as MpAttrNode;
        const el: MpElement = {
            id: idAttr.content as string,
            name: tagAttr.content as string,
            hasChild: tagAttr.content === 'App' ? true : hasChild(vw),
            alive: tagAttr.content === 'App' ? true : !vw.__wcDestoryed__
        };
        if (attrs.length > 1) {
            el.attrs = attrs.slice(1);
        }
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
    });
};

export const hasChild = (vw: any): boolean => {
    const MpViewInstances = getWcControlMpViewInstances();
    return MpViewInstances.some((item) => item.selectOwnerComponent() === vw);
};

export const getElementAttrs = (vw: any): Promise<MpAttrNode[]> => {
    if (isApp(vw)) {
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
        return Promise.resolve(attrs);
    }
    const attrs: MpAttrNode[] = [];
    const tagName = getMpViewType(vw);
    attrs.push({
        name: 'tag',
        content: tagName
    });
    attrs.push({
        name: 'id',
        content: vw.__wxExparserNodeId__
    });
    const route = vw.is || vw.route || vw.__route__;
    attrs.push({
        name: 'is',
        content: route
    });
    return Promise.resolve(attrs);
};

export const findPageIns = (id: string): any => {
    return findComponentIns(id);
};
export const findComponentIns = (id: string): any => {
    return getWcControlMpViewInstances().find((item) => (item as any).__wxExparserNodeId__ === id);
};
