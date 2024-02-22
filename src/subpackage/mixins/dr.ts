import type { MpMaterial, MpProduct } from '@/types/product';
import type { MpDataReaderComponentData } from '@/types/reader';
import { MpDataReaderAction } from '@/types/reader';
import { MpComponentMixin } from 'typescript-mp-component';
import type { HookScope } from '@/types/common';
import type { IMpProductController } from '@/types/hook';
import type { MpShowActionSheetOptions } from '@/types/view';

const filterPass = <T extends MpMaterial = MpMaterial>(item: T, keyword: string, ctx: any): boolean => {
    if (ctx.materialFilterPolicy) {
        return ctx.materialFilterPolicy(keyword, item);
    }
    const filterFields: string[] = item.indexs || [];
    return filterFields.some((item) => item === keyword || item.indexOf(keyword) !== -1);
};

export class DrMixin<T extends MpMaterial = MpMaterial> extends MpComponentMixin<
    MpDataReaderComponentData,
    NonNullable<unknown>
> {
    $wcProductController: IMpProductController;
    $showActionSheet: (options: MpShowActionSheetOptions | string[]) => Promise<number>;
    $showToast: (txt: string) => void;
    $updateData: (data: any, cb?: () => void) => void;
    $forceData: (data: any, cb?: () => void) => void;
    $drFilterKeyword: string;
    /** 已存在的id记录 */
    $drExistMaterial: Record<string, T>;
    /** 留存记录 */
    $drKeepSaveMaterialId: Record<string, 1>;
    /** 标记记录 */
    $drMarkMaterialId: Record<string, 1>;
    /** 置顶记录ID */
    $drTopMaterialId: string[];
    $drActions: Array<MpDataReaderAction>;
    $drActiveMaterialList: T[];
    $drActiveMaterialId: Record<string, number>;
    onCopyMaterial?: (item: T) => void;
    onAddActiveMaterial?: (material: T) => void;
    onReplaceActiveMaterial?: (material: T) => void;
    onRemoveActiveMaterial?: (material: T) => void;
    onSetActiveMaterialList?: () => void;
    constructor(public $drMaterialType?: HookScope) {
        super();
    }
    created() {
        this.$drFilterKeyword = '';
        this.$drExistMaterial = {};
        this.$drKeepSaveMaterialId = {};
        this.$drMarkMaterialId = {};
        this.$drTopMaterialId = [];
        this.$drActions = this.$drActions || [];
        this.$drActiveMaterialList = [];
        this.$drActiveMaterialId = {};
    }
    $drShowMaterialAction(rowId: string): Promise<[MpDataReaderAction, boolean?]> {
        if (!this.$drActions || !this.$drActions.length) {
            return Promise.reject(new Error('请配置materialActions'));
        }
        if (!(rowId in this.$drExistMaterial)) {
            return Promise.reject(new Error(`无法找到${rowId}对应的数据`));
        }
        const isTop = this.$drTopMaterialId.includes(rowId);
        const isMark = rowId in this.$drMarkMaterialId;
        const isKeepSave = rowId in this.$drKeepSaveMaterialId;
        const actions: MpDataReaderAction[] = [];
        const textList = this.$drActions.map((item) => {
            const action = item;
            actions.push(action);
            if (action === MpDataReaderAction.top) {
                return `${isTop ? '取消' : ''}置顶显示`;
            }
            if (action === MpDataReaderAction.mark) {
                return `${isMark ? '取消' : ''}标记`;
            }
            if (action === MpDataReaderAction.keepSave) {
                return `${isKeepSave ? '取消' : ''}留存`;
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                return '取消全部留存';
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                return '取消全部标记';
            }
            if (action === MpDataReaderAction.groupTo) {
                return '分类为...';
            }
            if (action === MpDataReaderAction.copy) {
                return '复制';
            }
            return '';
        });
        return this.$showActionSheet(textList).then((res) => {
            const action = actions[res];
            if (action === MpDataReaderAction.top) {
                if (isTop) {
                    this.$drCancelTopMaterial(rowId);
                } else {
                    this.$drTopMaterial(rowId);
                }
                return [action, isTop];
            }

            if (action === MpDataReaderAction.keepSave) {
                if (isKeepSave) {
                    this.$drCancelKeepSaveMaterial(rowId);
                } else {
                    this.$drKeepSaveMaterial(rowId);
                }
                return [action, isKeepSave];
            }
            if (action === MpDataReaderAction.mark) {
                if (isMark) {
                    this.$drCancelMarkMaterial(rowId);
                } else {
                    this.$drMarkMaterial(rowId);
                }
                return [action, isMark];
            }
            if (action === MpDataReaderAction.cancelAllMark) {
                this.$drCancelMarkMaterial();
                return [action];
            }
            if (action === MpDataReaderAction.cancelAllKeepSave) {
                this.$drCancelKeepSaveMaterial();
                return [action];
            }
            if (action === MpDataReaderAction.copy) {
                this.onCopyMaterial?.(this.$drExistMaterial[rowId]);
                return [action];
            }
            this.$showToast(`动作${action}功能待实现`);
            return [action];
        });
    }
    $drAddMaterialToActiveList(material: T, ignoreCategoryCheck?: boolean, fireAddCallback = true) {
        if (material.id in this.$drExistMaterial) {
            Object.assign(this.$drExistMaterial[material.id], material);
            material = this.$drExistMaterial[material.id];
        } else {
            this.$drExistMaterial[material.id] = material;
        }
        if (
            !ignoreCategoryCheck &&
            this.data.activeCategory !== 'all' &&
            !material.categorys?.includes(this.data.activeCategory)
        ) {
            return;
        }
        let needAdd = true;
        if (this.$drFilterKeyword) {
            needAdd = filterPass(material, this.$drFilterKeyword, this);
        }
        if (!needAdd) {
            return;
        }
        if (material.id in this.$drActiveMaterialId) {
            fireAddCallback && this.onReplaceActiveMaterial?.(material);
            return;
        }
        this.$drActiveMaterialId[material.id] = this.$drActiveMaterialList.length;
        this.$drActiveMaterialList.push(material);
        fireAddCallback && this.onAddActiveMaterial?.(material);
    }
    $drFilterMaterial(keyword: string) {
        this.$drFilterKeyword = keyword;
        this.$drChangeCategory(this.data.activeCategory);
    }

    $drChangeCategory(activeCategory: string) {
        if (this.data.activeCategory !== activeCategory) {
            this.$forceData({
                activeCategory
            });
        }

        this.$drActiveMaterialId = {};
        this.$drActiveMaterialList = [];
        if (activeCategory === 'mark') {
            Object.keys(this.$drMarkMaterialId).forEach((id) => {
                this.$drAddMaterialToActiveList(this.$drExistMaterial[id], true, false);
            });
        } else {
            Object.keys(this.$drExistMaterial).forEach((k) => {
                this.$drAddMaterialToActiveList(this.$drExistMaterial[k], false, false);
            });
        }
        this.onSetActiveMaterialList?.();
    }
    $drClearMaterial(onlyClearActive?: boolean) {
        if (!onlyClearActive) {
            // 清除所有数据，包括ProductController中的
            this.$drMarkMaterialId = {};
            this.$drTopMaterialId = [];
            this.$drActiveMaterialList = [];
            this.$drActiveMaterialId = {};
            if (this.$drMaterialType) {
                // 删除缓存中的数据，但保留keepsave
                const keepSaveMaterialIdList = Object.keys(this.$drKeepSaveMaterialId);
                this.$wcProductController.clear(this.$drMaterialType, keepSaveMaterialIdList);
            }

            Object.keys(this.$drExistMaterial).forEach((id) => {
                if (id in this.$drKeepSaveMaterialId) {
                    this.$drAddMaterialToActiveList(this.$drExistMaterial[id], false, false);
                    return;
                }
                delete this.$drExistMaterial[id];
            });
            this.onSetActiveMaterialList?.();
            return;
        }
        // 仅清除当前活动的数据，不会影响ProductController中的
        this.$drActiveMaterialList = [];
        this.$drActiveMaterialId = {};
        this.onSetActiveMaterialList?.();
    }
    $drKeepSaveMaterial(id: string) {
        this.$drKeepSaveMaterialId[id] = 1;
    }
    $drCancelKeepSaveMaterial(id?: string) {
        if (!id) {
            this.$drKeepSaveMaterialId = {};
            return;
        }
        delete this.$drKeepSaveMaterialId[id];
    }
    $drMarkMaterial(id: string) {
        this.$drMarkMaterialId[id] = 1;
    }
    $drCancelMarkMaterial(id?: string) {
        if (!id) {
            this.$drMarkMaterialId = {};
            if (this.data.activeCategory === 'mark') {
                this.$drClearMaterial(true);
            }
            return;
        }
        if (id in this.$drMarkMaterialId) {
            delete this.$drMarkMaterialId[id];
            if (this.data.activeCategory === 'mark' && id in this.$drActiveMaterialId) {
                this.$drActiveMaterialList.splice(this.$drActiveMaterialId[id], 1);
                delete this.$drActiveMaterialId[id];
                this.onRemoveActiveMaterial?.(this.$drExistMaterial[id]);
            }
        }
    }
    $drTopMaterial(id: string) {
        this.$drTopMaterialId.unshift(id);
        // 最多置顶3条
        if (this.$drTopMaterialId.length > 3) {
            this.$drTopMaterialId.length = 3;
        }
    }
    $drCancelTopMaterial(id?: string) {
        if (!id) {
            this.$drTopMaterialId = [];
            return;
        }
        const index = this.$drTopMaterialId.indexOf(id);
        if (index !== -1) {
            this.$drTopMaterialId.splice(index, 1);
        }
    }
    $drGetProduct(id: string): MpProduct | undefined {
        return this.$wcProductController.findById(id);
    }
}
