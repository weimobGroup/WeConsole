import { getMpViewType, promiseifyApi, toHump, wcScopeSingle } from '../../modules/util';
import { MpAttrNode, MpElement } from '../../types/element';
import { uniq } from './util';

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
                        content: item.attrs.find((it) => it.name === 'is').content
                    }
                ],
                children: []
            };
            res.push(el);
            map[item.name] = el;
        }
        if (parseInt(map[item.name].attrs[0].content) < 1) {
            map[item.name].attrs[0].content = String(parseInt(map[item.name].attrs[0].content) + 1);
            map[item.name].children.push(item);
        }
    });
    res.forEach((item, index) => {
        if (item.attrs[0].content === '1') {
            res[index] = item.children[0];
        } else {
            item.attrs.shift();
        }
    });
    return res;
};

const getMpViewInstances = () => wcScopeSingle('MpViewInstances', () => []) as any[];

export const getChildrenElements = (vw: any, group?: string): Promise<MpElement[]> => {
    const type = getMpViewType(vw);
    if (type === 'App') {
        const pages = getCurrentPages() as any[];
        if (!pages || !pages.length) {
            return Promise.resolve([]);
        }
        return Promise.all(pages.map((item) => getElement(item)));
    }
    const MpViewInstances = getMpViewInstances();
    if (type === 'Page') {
        const children = uniq(
            MpViewInstances.filter(
                (item) =>
                    getMpViewType(item) === 'Component' &&
                    item.getPageId() === `pageId:${vw.__wxWebviewId__}` &&
                    item.selectOwnerComponent() === vw
            )
        );
        return Promise.all(children.map((item) => getElement(item))).then((list) => {
            return getGroup(list as MpElement[]);
        });
    }
    if (type === 'Component') {
        const children = uniq(
            MpViewInstances.filter((item) => {
                if (group) {
                    return item.is === group;
                }
                return !!(item.selectOwnerComponent && item.selectOwnerComponent() === vw);
            })
        );
        return Promise.all(children.map((item) => getElement(item))).then((list) => {
            if (group) {
                return list as MpElement[];
            }
            return getGroup(list as MpElement[]);
        });
    }
    return Promise.resolve([]);
};

export const getElement = (vw: any): Promise<MpElement> => {
    const type = getMpViewType(vw);
    if (type === 'App') {
        return getElementAttrs(vw, type).then((attrs) => {
            const el: MpElement = {
                id: 'app',
                name: 'App',
                hasChild: hasChild(vw, type),
                alive: true
            };
            if (attrs) {
                el.attrs = attrs;
                el.id = el.attrs.find((item) => item.name === 'id').content;
            }
            return el;
        });
    }
    if (type === 'Page') {
        return getElementAttrs(vw, type).then((attrs) => {
            const el: MpElement = {
                id: vw.__wxWebviewId__,
                name: 'Page',
                hasChild: hasChild(vw, type),
                alive: !vw.__wcDestoryed__
            };
            if (attrs) {
                el.attrs = attrs;
            }
            return el;
        });
    }
    if (type === 'Component') {
        return getElementAttrs(vw, type).then((attrs) => {
            const componentPath = attrs.find((item) => item.name === 'is').content;
            const paths = componentPath.split('/');
            let name = toHump(
                paths[paths.length - 1] === 'index'
                    ? paths[paths.length > 1 ? paths.length - 2 : 0]
                    : paths[paths.length - 1]
            );
            if (name[0].toUpperCase() !== name[0]) {
                name = name[0].toUpperCase() + name.substr(1);
            }
            if (paths.length > 1 && paths[paths.length - 1] !== 'index') {
                name = toHump(paths[paths.length - 2]) + name;
            }
            if (name[0].toUpperCase() !== name[0]) {
                name = name[0].toUpperCase() + name.substr(1);
            }
            const el: MpElement = {
                id: vw.__wxExparserNodeId__,
                name,
                hasChild: hasChild(vw, type),
                alive: !vw.__wcDestoryed__
            };
            if (attrs) {
                el.attrs = attrs;
            }
            return el;
        });
    }
};

export const hasChild = (vw: any, type?: 'App' | 'Page' | 'Component'): boolean => {
    type = type || getMpViewType(vw);
    if (type === 'App') {
        return true;
    }
    const MpViewInstances = getMpViewInstances();
    if (type === 'Page') {
        return MpViewInstances.some(
            (item) =>
                getMpViewType(item) === 'Component' &&
                item.getPageId() === `pageId:${vw.__wxWebviewId__}` &&
                item.selectOwnerComponent() === vw
        );
    }
    if (type === 'Component') {
        return MpViewInstances.some((item) => {
            return item.selectOwnerComponent && item.selectOwnerComponent() === vw;
        });
    }
    return false;
};

export const getElementAttrs = (vw: any, type?: 'App' | 'Page' | 'Component'): Promise<MpAttrNode[] | undefined> => {
    type = type || getMpViewType(vw);
    if (type === 'App') {
        return promiseifyApi('getAccountInfoSync').then((res) => {
            if (res?.miniProgram && res.miniProgram.appId) {
                const attrs: MpAttrNode[] = [];
                attrs.push({
                    name: 'id',
                    content: res.miniProgram.appId
                });
                attrs.push({
                    name: 'env',
                    content: res.miniProgram.envVersion
                });
                if (res.miniProgram.version) {
                    attrs.push({
                        name: 'version',
                        content: res.miniProgram.version
                    });
                }
                return attrs;
            }
        });
    }
    if (type === 'Page') {
        const attrs: MpAttrNode[] = [];
        attrs.push({
            name: 'id',
            content: vw.__wxWebviewId__
        });
        const route = vw.is || vw.route || vw.__route__;
        attrs.push({
            name: 'is',
            content: route
        });
        return Promise.resolve(attrs);
    }
    if (type === 'Component') {
        const attrs: MpAttrNode[] = [];
        attrs.push({
            name: 'id',
            content: vw.__wxExparserNodeId__
        });
        attrs.push({
            name: 'is',
            content: vw.is
        });
        return Promise.resolve(attrs);
    }
};

export const findPageIns = (id: string): any | undefined => {
    const res = ((getCurrentPages() || []) as any[]).find((item) => item.__wxWebviewId__ === id);
    if (res) {
        return res;
    }
    return getMpViewInstances().find((item) => item.__wxWebviewId__ === id);
};
export const findComponentIns = (id: string): any | undefined => {
    return getMpViewInstances().find((item) => item.__wxExparserNodeId__ === id);
};
