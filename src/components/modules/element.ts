import { promiseifyApi, toHump, wcScopeSingle, isApp, getMpViewType } from '../../modules/util';
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
    if (isApp(vw)) {
        const pages = getCurrentPages() as any[];
        if (!pages || !pages.length) {
            return Promise.resolve([]);
        }
        return Promise.all(pages.map((item) => getElement(item)));
    }
    const MpViewInstances = getMpViewInstances();
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
        const tagAttr = attrs.find((item) => item.name === 'tag');
        const idAttr = attrs.find((item) => item.name === 'id');
        const el: MpElement = {
            id: idAttr.content,
            name: tagAttr.content,
            hasChild: tagAttr.content === 'App' ? true : hasChild(vw),
            alive: tagAttr.content === 'App' ? true : !vw.__wcDestoryed__
        };
        if (attrs.length > 1) {
            el.attrs = attrs.slice(1);
        }
        if (tagAttr.content === 'Component') {
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
    const MpViewInstances = getMpViewInstances();
    return MpViewInstances.some((item) => item.selectOwnerComponent() === vw);
};

export const getElementAttrs = (vw: any): Promise<MpAttrNode[] | undefined> => {
    if (isApp(vw)) {
        return promiseifyApi('getAccountInfoSync').then((res) => {
            if (res?.miniProgram && res.miniProgram.appId) {
                const attrs: MpAttrNode[] = [];
                attrs.push({
                    name: 'tag',
                    content: 'App'
                });
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

export const findPageIns = (id: string): any | undefined => {
    return findComponentIns(id);
};
export const findComponentIns = (id: string): any | undefined => {
    return getMpViewInstances().find((item) => item.__wxExparserNodeId__ === id);
};
