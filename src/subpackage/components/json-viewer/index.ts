import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { registerClassComponent } from '@/sub/mixins/component';

import { equalJSONPropPath, getJSONNode, getPathValue } from '@/sub/modules/json';
import { cutJSONNode, JSONViewer } from '@/sub/modules/json-viewer';
import type { IJSONViewer, JSONNode, JSONPropPath, JSONRow, JSONTree, JSONValue } from '@/types/json';
import type {
    MpJSONViewerComponentData,
    MpJSONViewerComponentEventDetail,
    MpJSONViewerComponentProps
} from '@/types/json-viewer';
import { MpJSONViewerComponentMode } from '@/types/json-viewer';
import type { MpEvent } from '@/types/view';
import { log, rpxToPx } from '@/main/modules/util';
import type { AnyFunction } from '@/types/util';
import { ToolMixin } from '@/sub/mixins/tool';
// eslint-disable-next-line quotes
const fontName = "Consolas, Menlo, Monaco, 'Courier New', monospace";

export interface MpJSONViewerComponentEbusDetail {
    from: string;
    viewer: JsonViewer;
}

export class JsonViewer extends MpComponent<MpJSONViewerComponentData, MpJSONViewerComponentProps> {
    inited: boolean;
    initPromise?: Promise<void>;
    JSONViewer?: IJSONViewer;
    target: any;
    onInitedHandlers?: AnyFunction[];
    lastPath?: JSONPropPath;
    lastOpen?: boolean;
    isDetached: boolean;
    $mx = {
        Tool: new ToolMixin()
    };
    options = {
        multipleSlots: true
    };
    properties?: MpComponentProperties<MpJSONViewerComponentProps, JsonViewer> = {
        target: null,
        json: {
            type: Object
        },
        outerClass: String,
        title: String,
        from: String,
        init: {
            type: Boolean,
            value: true
        },
        mode: {
            type: Number,
            value: MpJSONViewerComponentMode.full
        },
        fontSize: {
            type: Number,
            value: 28,
            observer() {
                this.syncFontSize();
            }
        },
        smallFontSize: {
            type: Number,
            value: 28 * 0.8,
            observer() {
                this.syncFontSize();
            }
        }
    };
    initData: MpJSONViewerComponentData = {
        root: null,
        activeTab: 0,
        JSONString: '',
        tabs: [
            {
                name: 'Tree',
                value: MpJSONViewerComponentMode.tree
            },
            {
                name: 'String',
                value: MpJSONViewerComponentMode.string
            }
        ]
    };
    created() {
        this.lastOpen = false;
        this.lastPath = [];
    }
    attached() {
        if (this.data.json) {
            this.$mx.Tool.$forceData({
                root: this.data.json
            });
        }
        if (this.data.init) {
            this.init();
        }
    }
    ready() {
        this.$mx.Tool.$wcEmit('JSONViewerReady', {
            from: this.data.from,
            viewer: this
        });
    }
    detached() {
        delete this.target;
    }
    syncFontSize() {
        if (!this.JSONViewer) {
            return;
        }
        this.JSONViewer.options.fontSize = this.data.fontSize || 28;
        this.JSONViewer.options.keyFontSize = this.data.smallFontSize || 28 * 0.8;
    }
    onInited(func: AnyFunction) {
        if (this.inited) {
            return func(this);
        }
        if (!this.onInitedHandlers) {
            this.onInitedHandlers = [];
        }
        this.onInitedHandlers.push(func);
    }
    openPath(path?: JSONPropPath) {
        this.setPathVisible(true, path);
    }
    closePath(path?: JSONPropPath) {
        this.setPathVisible(false, path);
    }
    buildPath(open: boolean, path?: JSONPropPath): any {
        if (!this.JSONViewer) {
            log('warn', '未初始化，暂时无法设置显示性');
            return;
        }
        const JSONViewer = this.JSONViewer;
        const mpData: any = {};

        if (!path || !path.length) {
            mpData['root.tree'] = open ? JSONViewer.getJSONTree() : null;
            mpData['root.open'] = open;
            return mpData;
        }
        const jsonPath: JSONPropPath = JSONViewer.restoreJSONPropPath(path as string[]);
        let mpPath = 'root.tree';
        const readyPath: JSONPropPath = [];
        const getTree = (parent: JSONNode | JSONRow, init = true): JSONTree | undefined => {
            if (!parent) {
                return;
            }
            if (parent.tree) {
                return parent.tree;
            }
            if (init) {
                const tree = JSONViewer.getJSONTree(readyPath);
                mpData[mpPath] = tree;
                mpData[mpPath.substr(0, mpPath.length - 5) + '.open'] = true;
                return tree;
            }
        };
        let tree = getTree((this.data.root as JSONNode) || JSONViewer.getJSONNode()) as JSONTree;
        for (let len = jsonPath.length, i = 0; i < len; i++) {
            const prop = jsonPath[i];
            readyPath.push(prop);
            const index = tree.findIndex((item) =>
                equalJSONPropPath(JSONViewer.restoreJSONPropPath(item.path as string[]), readyPath)
            );
            if (index === -1) {
                break;
            }
            mpPath += `[${index}].tree`;
            tree = getTree(tree[index], i !== len - 1) as JSONTree;
            if (!tree) {
                break;
            }
        }
        if (equalJSONPropPath(readyPath, jsonPath) && !tree && open) {
            tree = this.JSONViewer.getJSONTree(readyPath);
        }
        mpData[mpPath] = open ? tree : null;
        mpData[mpPath.substr(0, mpPath.length - 5) + '.open'] = open;
        return mpData;
    }
    setPathVisible(open: boolean, path?: JSONPropPath) {
        if (this.isDetached) {
            return;
        }
        this.lastOpen = open;
        this.lastPath = path;
        this.$mx.Tool.$forceData(this.buildPath(open, path));
    }
    toggle(e: MpEvent<MpJSONViewerComponentEventDetail>) {
        const { open, path, fromCompute } = e.detail as MpJSONViewerComponentEventDetail;
        if (fromCompute) {
            this.buildComputeObject(path);
            return;
        }
        this.setPathVisible(open, path);
        if (BUILD_TARGET === 'xhs') {
            setTimeout(() => {
                this.triggerEvent('toggle', e.detail);
            }, 100);
            return;
        }
        this.triggerEvent('toggle', e.detail);
    }
    buildComputeObject(path: JSONPropPath) {
        if (!this.JSONViewer) {
            return;
        }
        const JSONViewer = this.JSONViewer;
        const mpData: any = {};
        const jsonPath: JSONPropPath = JSONViewer.restoreJSONPropPath(path as string[]);
        let mpPath = 'root.tree';
        const readyPath: JSONPropPath = [];
        const getTree = (parent: JSONNode | JSONRow): JSONTree | undefined => {
            if (!parent) {
                return;
            }
            if (parent.tree) {
                return parent.tree;
            }
        };
        let tree = getTree(this.data.root as JSONNode) as JSONTree;
        for (let len = jsonPath.length, i = 0; i < len; i++) {
            const prop = jsonPath[i];
            readyPath.push(prop);
            const index = tree.findIndex((item) =>
                equalJSONPropPath(JSONViewer.restoreJSONPropPath(item.path as string[]), readyPath)
            );
            if (index === -1) {
                break;
            }
            mpPath += `[${index}].tree`;
            const oldTree = tree;
            tree = getTree(tree[index]) as JSONTree;
            if (!tree) {
                tree = oldTree;
                mpPath = mpPath.substr(0, mpPath.length - 5);
                break;
            }
        }
        const val = getPathValue(this.JSONViewer.options.target, jsonPath, false);
        const node = getJSONNode(val) as JSONValue;
        node.value = true;
        node.path = jsonPath;
        cutJSONNode(
            node,
            this.JSONViewer.options.maxWidth - this.JSONViewer.getPathPropWidth(jsonPath),
            this.JSONViewer.measureText
        );
        node.path = this.JSONViewer.replaceJSONPropPath(jsonPath);
        mpPath += '.value';
        mpData[mpPath] = node;
        this.$mx.Tool.$forceData(mpData);
    }
    measureText(str: string, fontSize: number): number {
        if (!this.$mx.Tool.$wcCanvasContext) {
            return fontSize * str.length;
        }
        this.$mx.Tool.$wcCanvasContext.font = `${fontSize}px ${fontName}`;
        return this.$mx.Tool.$wcCanvasContext.measureText(str).width;
    }
    initJSONViewer(): Promise<void> {
        if (this.JSONViewer || this.isDetached) {
            return Promise.resolve();
        }
        if (!this.initPromise) {
            this.initPromise = Promise.all([
                this.$mx.Tool.$getBoundingClientRect('.json-viewer'),
                this.$mx.Tool.$getCanvasContext().catch(() => {})
            ])
                .then(([{ width }]) => {
                    const target =
                        'target' in (this as any) ? this.target : 'target' in this.data ? this.data.target : undefined;
                    this.JSONViewer = new JSONViewer({
                        target: target,
                        arrowWidth: rpxToPx(20),
                        fontSize: rpxToPx(this.data.fontSize || 28),
                        keyFontSize: rpxToPx(this.data.smallFontSize || 28 * 0.8),
                        measureText: this.measureText.bind(this),
                        maxWidth: width - rpxToPx(100)
                    });
                    const jsonViewer = this.JSONViewer;
                    return new Promise<void>((resolve) => {
                        const mpData = this.data.root ? {} : { root: jsonViewer.getJSONNode() };
                        if (this.lastPath) {
                            Object.assign(mpData, this.buildPath(!!this.lastOpen, this.lastPath));
                        }
                        this.$mx.Tool.$forceData(mpData, () => {
                            this.triggerEvent('first', this.data.root);
                            resolve();
                        });
                    });
                })
                .catch((err) => {
                    if (this.$mx.Tool.$wcComponentIsDestroyed) {
                        return;
                    }
                    return Promise.reject(err);
                });
        }
        return this.initPromise;
    }
    setJSONString(): Promise<void> {
        return new Promise((resolve) => {
            const target =
                'target' in (this as any) ? this.target : 'target' in this.data ? this.data.target : undefined;
            const type = typeof target;
            let JSONString;
            if (type === 'undefined') {
                JSONString = 'undefined';
            } else if (type === 'function') {
                JSONString = target.toString();
            } else {
                JSONString = JSON.stringify(target, null, 2);
            }
            this.$mx.Tool.$updateData(
                {
                    JSONString: JSONString
                },
                resolve
            );
        });
    }
    setTarget(target?: any, updateUI = true) {
        if (this.isDetached) {
            return;
        }
        this.target = target;
        if (this.data.mode === MpJSONViewerComponentMode.full || this.data.mode === MpJSONViewerComponentMode.string) {
            updateUI && this.setJSONString();
        }
        if (
            (this.data.mode === MpJSONViewerComponentMode.full || this.data.mode === MpJSONViewerComponentMode.tree) &&
            this.JSONViewer
        ) {
            this.JSONViewer.setTarget(this.target);
            updateUI &&
                this.$mx.Tool.$updateData({
                    root: this.JSONViewer.getJSONNode()
                });
        }
    }
    changeTab(e) {
        this.$mx.Tool.$forceData({
            activeTab: parseInt(e.detail)
        });
        if (parseInt(e.detail) === 1) {
            this.initJSONViewer();
        } else {
            this.setJSONString();
        }
    }
    init(): Promise<void> {
        if (this.inited || this.isDetached) {
            return Promise.resolve();
        }
        const fire = () => {
            if (this.onInitedHandlers && this?.onInitedHandlers.length) {
                this.onInitedHandlers.forEach((item) => {
                    item?.(this);
                });
                delete this.onInitedHandlers;
            }
        };
        if (this.data.mode === MpJSONViewerComponentMode.full) {
            return Promise.all([this.setJSONString(), this.initJSONViewer()]).then(() => {
                this.inited = true;
                fire();
            });
        }
        if (this.data.mode === MpJSONViewerComponentMode.tree) {
            return this.initJSONViewer().then(() => {
                this.inited = true;
                fire();
            });
        }
        if (this.data.mode === MpJSONViewerComponentMode.string) {
            return this.setJSONString().then(() => {
                this.inited = true;
                fire();
            });
        }
        return Promise.resolve();
    }
}

registerClassComponent(JsonViewer);
