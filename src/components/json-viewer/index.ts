import { WeComponent } from '../mixins/component';
import { equalJSONPropPath, getJSONNode, getPathValue } from '../modules/json';
import { cutJSONNode, JSONViewer } from '../modules/json-viewer';
import { getSystemInfo } from '../modules/util';
import type { JSONNode, JSONPropPath, JSONRow, JSONTree, JSONValue } from '../../types/json';
import EbusMixin from '../mixins/ebus';
import CanvasMixin from '../mixins/canvas';
import type { MpJSONViewerComponentEventDetail, MpJSONViewerComponentSpec } from '../../types/json-viewer';
import { MpJSONViewerComponentMode } from '../../types/json-viewer';
import type { MpEvent } from '../../types/view';
import { log } from '../../modules/util';
import type { AnyFunction } from '../../types/util';
// eslint-disable-next-line quotes
const fontName = "Consolas, Menlo, Monaco, 'Courier New', monospace";
const Spec: MpJSONViewerComponentSpec = {
    options: {
        multipleSlots: true
    },
    properties: {
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
    },
    data: {
        root: null,
        activeTab: 0,
        JSONString: '',
        tabs: [
            {
                name: 'Tree',
                value: MpJSONViewerComponentMode.tree
            },
            {
                name: 'JSON String',
                value: MpJSONViewerComponentMode.string
            }
        ]
    },
    methods: {
        syncFontSize() {
            if (!this.JSONViewer) {
                return;
            }
            this.JSONViewer.options.fontSize = this.data.fontSize || 28;
            this.JSONViewer.options.keyFontSize = this.data.smallFontSize || 28 * 0.8;
        },
        onInited(func: AnyFunction) {
            if (this.inited) {
                return func(this);
            }
            if (!this.onInitedHandlers) {
                this.onInitedHandlers = [];
            }
            this.onInitedHandlers.push(func);
        },
        openPath(path?: JSONPropPath) {
            this.setPathVisable(true, path);
        },
        closePath(path?: JSONPropPath) {
            this.setPathVisable(false, path);
        },
        buildPath(open: boolean, path?: JSONPropPath): any {
            if (!this.JSONViewer) {
                log('warn', '未初始化，暂时无法设置显示性');
                return;
            }
            const mpData: any = {};

            if (!path || !path.length) {
                mpData['root.tree'] = open ? this.JSONViewer.getJSONTree() : null;
                mpData['root.open'] = open;
                return mpData;
            }
            const jsonPath: JSONPropPath = this.JSONViewer.restoreJSONPropPath(path as string[]);
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
                    const tree = this.JSONViewer.getJSONTree(readyPath);
                    mpData[mpPath] = tree;
                    mpData[mpPath.substr(0, mpPath.length - 5) + '.open'] = true;
                    return tree;
                }
            };
            let tree = getTree((this.data.root as JSONNode) || this.JSONViewer.getJSONNode());
            for (let len = jsonPath.length, i = 0; i < len; i++) {
                const prop = jsonPath[i];
                readyPath.push(prop);
                const index = tree.findIndex((item) =>
                    equalJSONPropPath(this.JSONViewer.restoreJSONPropPath(item.path as string[]), readyPath)
                );
                if (index === -1) {
                    break;
                }
                mpPath += `[${index}].tree`;
                tree = getTree(tree[index], i !== len - 1);
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
        },
        setPathVisable(open: boolean, path?: JSONPropPath) {
            this.lastOpen = open;
            this.lastPath = path;
            this.updateData(this.buildPath(open, path));
        },
        toggle(e: MpEvent<MpJSONViewerComponentEventDetail>) {
            const { open, path, fromCompute } = e.detail;
            if (fromCompute) {
                this.buildComputeObject(path);
                return;
            }
            this.setPathVisable(open, path);
            this.triggerEvent('toggle', e.detail);
        },
        buildComputeObject(path: JSONPropPath) {
            const mpData: any = {};
            const jsonPath: JSONPropPath = this.JSONViewer.restoreJSONPropPath(path as string[]);
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
            let tree = getTree(this.data.root as JSONNode);
            for (let len = jsonPath.length, i = 0; i < len; i++) {
                const prop = jsonPath[i];
                readyPath.push(prop);
                const index = tree.findIndex((item) =>
                    equalJSONPropPath(this.JSONViewer.restoreJSONPropPath(item.path as string[]), readyPath)
                );
                if (index === -1) {
                    break;
                }
                mpPath += `[${index}].tree`;
                const oldTree = tree;
                tree = getTree(tree[index]);
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
            this.updateData(mpData);
        },
        rpxToPx(rpx: number): number {
            return (this.windowWidth / 750) * rpx;
        },
        measureText(str: string, fontSize: number): number {
            if (!this.$wcCanvasContext) {
                return Infinity;
            }
            this.$wcCanvasContext.font = `${fontSize}px ${fontName}`;
            return this.$wcCanvasContext.measureText(str).width;
        },
        initJSONViewer(): Promise<any> {
            if (this.JSONViewer) {
                return Promise.resolve();
            }
            return Promise.all([getSystemInfo(), this.$getBoundingClientRect('.json-viewer'), this.$getCanvasContext()])
                .then(([{ windowWidth }, { width }]) => {
                    this.windowWidth = windowWidth;
                    this.measureText = this.measureText.bind(this);
                    const target =
                        'target' in (this as any) ? this.target : 'target' in this.data ? this.data.target : undefined;
                    this.JSONViewer = new JSONViewer({
                        target: target,
                        arrowWidth: this.rpxToPx(20),
                        fontSize: this.rpxToPx(this.data.fontSize || 28),
                        keyFontSize: this.rpxToPx(this.data.smallFontSize || 28 * 0.8),
                        measureText: this.measureText,
                        maxWidth: width - this.rpxToPx(100)
                    });
                    return new Promise<void>((resolve) => {
                        const mpData = this.data.root ? {} : { root: this.JSONViewer.getJSONNode() };
                        if (this.lastPath) {
                            Object.assign(mpData, this.buildPath(this.lastOpen, this.lastPath));
                        }
                        this.updateData(mpData, () => {
                            this.triggerEvent('first', this.data.root);
                            resolve();
                        });
                    });
                })
                .catch((err) => {
                    if (this.$wcComponentIsDeatoryed) {
                        return;
                    }
                    return Promise.reject(err);
                });
        },
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
                this.updateData(
                    {
                        JSONString: JSONString
                    },
                    resolve
                );
            });
        },
        setTarget(target?: any, updateUI = true) {
            this.target = target;
            if (
                this.data.mode === MpJSONViewerComponentMode.full ||
                this.data.mode === MpJSONViewerComponentMode.string
            ) {
                updateUI && this.setJSONString();
            }
            if (
                (this.data.mode === MpJSONViewerComponentMode.full ||
                    this.data.mode === MpJSONViewerComponentMode.tree) &&
                this.JSONViewer
            ) {
                this.JSONViewer.setTarget(this.target);
                updateUI &&
                    this.updateData({
                        root: this.JSONViewer.getJSONNode()
                    });
            }
        },
        changeTab(e) {
            this.updateData({
                activeTab: parseInt(e.detail)
            });
            if (parseInt(e.detail) === 1) {
                this.initJSONViewer('1');
            } else {
                this.setJSONString();
            }
        },
        init(): Promise<any> {
            if (this.inited) {
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
        }
    },
    created() {
        this.lastOpen = false;
        this.lastPath = [];
    },
    attached() {
        if (this.data.json) {
            this.updateData({
                root: this.data.json
            });
        }
    },
    ready() {
        if (this.data.init) {
            this.init();
        }
        this.$wcEmit('JSONViewerReady', {
            from: this.data.from,
            viewer: this
        });
    }
};
WeComponent(EbusMixin, CanvasMixin as any, Spec);
