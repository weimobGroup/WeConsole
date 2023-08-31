import { isEmptyObject } from '@mpkit/util';
import { MpVirtualListComponentData, MpVirtualListComponentSpec } from '../../types/virtual-list';

const Mixin: MpVirtualListComponentSpec = {
    data: {
        $vlScrollTop: 0,
        $vlContainerSelector: '.vl-scroller',
        $vlTotalCount: 0,
        $vlShowList: [],
        $vlStartPlaceholderHeight: 0,
        $vlEndPlaceholderHeight: 0,
        $vlPageSize: 10,
        $vlUpdateDelay: 50
    },
    methods: {
        $vlReload() {
            this.$vlComputeContainerHeight(() => {
                this.setData(
                    {
                        $vlScrollTop: this.data.$vlScrollTop && this.data.$vlScrollTop < 5 ? 0 : 1
                    },
                    () => {
                        this.$vlComputeShowList();
                    }
                );
            });
        },
        $vlInit() {
            if (!this.$vlScrollTop) {
                this.$vlScrollTop = this.$vlOldScrollTop = 0;
            }
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            delete this.$vlContainerHeightComputeing;
            delete this.$vlContainerHeightComputeQueue;
            this.setData({
                $vlShowList: [],
                $vlStartPlaceholderHeight: 0,
                $vlEndPlaceholderHeight: 0
            });
            const pageSize = this.$vlGetPageSize ? this.$vlGetPageSize() : this.data.$vlPageSize;
            this.$vlSetShowList(0, pageSize);
            this.$vlReload();
        },
        $vlOnScroll(e) {
            if (this.$vlClearing) {
                return;
            }
            const { scrollTop } = e.detail;
            this.$vlOldScrollTop = this.$vlScrollTop;
            this.$vlScrollTop = scrollTop;
            this.$vlComputeShowList();
        },
        $vlAddItem(item) {
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            const readyItem = this.$vlAllList.find((it) => it.id === item.id);
            if (readyItem) {
                Object.assign(readyItem, item);
            } else {
                this.$vlAllList.push(item);
            }
            const readyShowIndex = this.data.$vlShowList.findIndex((it) => it.id === item.id);
            if (readyShowIndex !== -1) {
                this.$vlLock();
                this.setData(
                    {
                        [`$vlShowList[${readyShowIndex}]`]: readyItem
                    },
                    () => {
                        this.$vlUnLock();
                    }
                );
                return this.$vlListChange();
            }
            this.$vlListChange();
        },
        $vlListChange() {
            this.setData({
                $vlTotalCount: this.$vlAllList.length
            });
            this.$vlComputeShowList();
        },
        $vlClear(): Promise<void> {
            return new Promise((resolve) => {
                this.$vlClearing = true;
                if (this.$vlSetDataTimer) {
                    clearTimeout(this.$vlSetDataTimer);
                    delete this.$vlSetDataTimer;
                }
                if (this.$vlComputeShowListTimer) {
                    clearTimeout(this.$vlComputeShowListTimer);
                    delete this.$vlComputeShowListTimer;
                }
                delete this.$vlItemClientRectQueryMap;
                this.$vlScrollTop = 0;
                this.$vlOldScrollTop = 0;
                delete this.$vlAllList;
                delete this.$vlItemHeightMap;
                delete this.$vlContainerHeightComputeing;
                delete this.$vlContainerHeightComputeQueue;
                this.$vlStartIndex = 0;
                this.$vlEndIndex = 0;
                this.setData(
                    {
                        $vlScrollTop: 0,
                        $vlTotalCount: 0,
                        $vlShowList: [],
                        $vlStartPlaceholderHeight: 0,
                        $vlEndPlaceholderHeight: 0
                    },
                    () => {
                        this.$vlScrollTop = 0;
                        this.$vlOldScrollTop = 0;
                        delete this.$vlClearing;
                        setTimeout(resolve, 50);
                    }
                );
            });
        },
        $vlComputeItemHeight(id: string) {
            if (!this.$vlItemHeightComputeMap) {
                this.$vlItemHeightComputeMap = {};
            }
            if (!(id in this.$vlItemHeightComputeMap)) {
                this.$vlItemHeightComputeMap[id] = this.$getBoundingClientRect(`.vl-item-${id}`).then((res) => {
                    if (this?.$vlItemHeightComputeMap && id in this.$vlItemHeightComputeMap) {
                        this.$vlSetItemHeight(id, res.height);
                        delete this.$vlItemHeightComputeMap[id];
                    }
                    return res.height;
                });
            }
            return this.$vlItemHeightComputeMap[id];
        },
        $vlLockScrollTo(top: number) {
            this.$vlLock();
            this.setData(
                {
                    $vlScrollTop: top
                },
                () => {
                    this.$vlUnLock();
                }
            );
        },
        $vlComputeContainerHeight(callback) {
            if (this.$vlContainerHeightComputeing) {
                this.$vlContainerHeightComputeQueue.push(callback);
                return;
            }
            this.$vlContainerHeightComputeing = true;
            this.$vlContainerHeightComputeQueue = [];
            this.$getBoundingClientRect(this.data.$vlContainerSelector).then((res) => {
                this.$vlContainerHeight = res.height;
                this?.$vlOnContainerHeightComputed && this.$vlOnContainerHeightComputed();
                callback?.(res.height);
                if (!this.$vlContainerHeightComputeing) {
                    return;
                }
                delete this.$vlContainerHeightComputeing;
                if (this?.$vlContainerHeightComputeQueue && this.$vlContainerHeightComputeQueue.length) {
                    const last = this.$vlContainerHeightComputeQueue.pop();
                    this.$vlContainerHeightComputeQueue.forEach((item) => {
                        item?.(res.height);
                    });
                    this.$vlComputeContainerHeight(last);
                }
            });
        },
        $vlComputeShowList() {
            if (this.$vlClearing || !this.$vlAllList || !this.$vlAllList.length) {
                return;
            }
            if (this.$vlIsLock) {
                this.$vlHasListUpdate = true;
                return;
            }
            if (this.$vlComputeShowListTimer) {
                clearTimeout(this.$vlComputeShowListTimer);
            }
            // eslint-disable-next-line complexity
            this.$vlComputeShowListTimer = setTimeout(() => {
                const oldStart = this.$vlStartIndex;
                const oldEnd = this.$vlEndIndex;
                const vlGetItemHeight = this.$vlGetItemHeight ? this.$vlGetItemHeight : (): any => {};
                let firstIntersectIndex = -1;
                let visableHeight = 0;
                let lastIntersectIndex = -1;
                let top = 0;
                if (!this.$vlItemHeightMap) {
                    this.$vlItemHeightMap = {};
                }
                const staticHeight =
                    this.data.$vlItemStaticHeight && typeof this.data.$vlItemStaticHeight === 'number'
                        ? this.data.$vlItemStaticHeight
                        : null;
                for (let index = 0, len = this.$vlAllList.length; index < len; index++) {
                    const item = this.$vlAllList[index];
                    (item as any).$vlIndex = index;
                    if (!staticHeight) {
                        this.$vlItemHeightMap[item.id] =
                            vlGetItemHeight.call(this, index) || this.$vlItemHeightMap[item.id] || 0;
                    } else {
                        this.$vlItemHeightMap[item.id] = staticHeight;
                    }
                    if (typeof this.$vlItemHeightMap[item.id] === 'number') {
                        top += this.$vlItemHeightMap[item.id];
                    } else if (typeof this.data.$vlItemPrecutHeight === 'number') {
                        top += this.data.$vlItemPrecutHeight;
                    }

                    if (top >= this.$vlScrollTop) {
                        if (firstIntersectIndex === -1) {
                            firstIntersectIndex = index;
                        }
                        if (firstIntersectIndex !== -1 && lastIntersectIndex === -1) {
                            visableHeight += this.$vlItemHeightMap[item.id];
                        }
                        if (visableHeight >= this.$vlContainerHeight && lastIntersectIndex === -1) {
                            lastIntersectIndex = index;
                        }
                        if (lastIntersectIndex !== -1 && firstIntersectIndex !== -1) {
                            break;
                        }
                    }
                }

                let newStart = oldStart;
                let newEnd = oldEnd;
                const pageSize = this.$vlGetPageSize ? this.$vlGetPageSize() : this.data.$vlPageSize;
                let needUpdate = this.data.$vlShowList.length < pageSize;
                needUpdate =
                    needUpdate ||
                    !this.$vlPrevScrollInfo ||
                    (this.$vlPrevScrollInfo[0] !== this.$vlOldScrollTop &&
                        this.$vlPrevScrollInfo[1] !== this.$vlScrollTop);
                if (!needUpdate) {
                    return;
                }
                this.$vlPrevScrollInfo = [this.$vlOldScrollTop, this.$vlScrollTop];
                if (this.data.$vlShowList.length < pageSize) {
                    newEnd = newStart + pageSize;
                    newEnd = newEnd <= this.$vlAllList.length ? newEnd : this.$vlAllList.length;
                } else if (lastIntersectIndex !== -1 && firstIntersectIndex !== -1) {
                    let count = lastIntersectIndex - firstIntersectIndex;
                    newStart = firstIntersectIndex;
                    newEnd = lastIntersectIndex;
                    while (count < 20) {
                        newStart = newStart - 1 < 0 ? 0 : newStart - 1;
                        newEnd = newEnd + 1 > this.$vlAllList.length ? this.$vlAllList.length : newEnd + 1;
                        if (newEnd - newStart === count && newStart === 0 && newEnd === this.$vlAllList.length) {
                            break;
                        }
                        count = newEnd - newStart;
                        if (count > 20) {
                            if (newStart) {
                                newStart--;
                            } else {
                                newEnd--;
                            }
                            break;
                        }
                    }
                    if (newStart < 0) {
                        newStart = 0;
                    }
                } else if (!oldStart && !oldEnd) {
                    newEnd = pageSize;
                }
                this.$vlSetShowList(newStart, newEnd);
            }, this.data.$vlUpdateDelay);
        },
        $vlLock() {
            this.$vlIsLock = true;
        },
        $vlUnLock() {
            delete this.$vlIsLock;
            if (this.$vlHasListUpdate) {
                delete this.$vlHasListUpdate;
                this.$vlComputeShowList();
            }
        },
        // eslint-disable-next-line complexity
        $vlSetShowList(startIndex, endIndex) {
            const pageSize = this.$vlGetPageSize ? this.$vlGetPageSize() : this.data.$vlPageSize;
            let vlStartIndex;
            if (startIndex < 0) {
                vlStartIndex = 0;
            } else if (startIndex < this.$vlAllList.length) {
                vlStartIndex = startIndex;
            } else if (this.$vlAllList.length) {
                vlStartIndex = this.$vlAllList.length - 1;
            } else {
                vlStartIndex = 0;
            }
            let vlEndIndex = endIndex < 0 || endIndex > this.$vlAllList.length ? this.$vlAllList.length : endIndex;
            if (vlEndIndex - vlStartIndex < pageSize && this.$vlAllList.length < pageSize) {
                vlStartIndex = 0;
                vlEndIndex = this.$vlAllList.length;
            }
            const needUpdate =
                vlStartIndex !== this.$vlStartIndex ||
                vlEndIndex !== this.$vlEndIndex ||
                !this.data.$vlShowList ||
                !this.data.$vlShowList.length;
            if (needUpdate) {
                this.$vlStartIndex = vlStartIndex;
                this.$vlEndIndex = vlEndIndex;
                this.$vlLock();
                let startHeight = 0;
                let endHeight = 0;
                const list = [];
                const staticHeight =
                    this.data.$vlItemStaticHeight && typeof this.data.$vlItemStaticHeight === 'number'
                        ? this.data.$vlItemStaticHeight
                        : null;
                const precutHeight =
                    this.data.$vlItemPrecutHeight && typeof this.data.$vlItemPrecutHeight === 'number'
                        ? this.data.$vlItemPrecutHeight
                        : null;
                this.$vlAllList.forEach((item, index) => {
                    let itemHeight;
                    if (this.$vlItemHeightMap[item.id]) {
                        itemHeight = this.$vlItemHeightMap[item.id];
                    } else if (staticHeight) {
                        itemHeight = staticHeight;
                    } else if (typeof this.$vlGetItemHeight === 'function') {
                        itemHeight = this.$vlGetItemHeight(index) || 0;
                    } else if (precutHeight) {
                        itemHeight = precutHeight;
                    } else {
                        itemHeight = 0;
                    }
                    if (index < this.$vlStartIndex) {
                        startHeight += itemHeight;
                    } else if (index >= this.$vlStartIndex && index < this.$vlEndIndex) {
                        list.push(item);
                    } else {
                        endHeight += itemHeight;
                    }
                });
                const renderData: Partial<MpVirtualListComponentData> = {};
                const renderCallbacks = [];
                if (this.data.$vlStartPlaceholderHeight !== startHeight) {
                    renderData.$vlStartPlaceholderHeight = startHeight;
                }
                if (this.data.$vlEndPlaceholderHeight !== endHeight) {
                    renderData.$vlEndPlaceholderHeight = endHeight;
                }
                if (!this.$vlItemClientRectQueryMap) {
                    this.$vlItemClientRectQueryMap = {};
                }
                const mergeList = [];
                list.forEach((item) => {
                    if (!this.$vlItemClientRectQueryMap[item.id]) {
                        this.$vlItemClientRectQueryMap[item.id] = () => {
                            return this.$vlComputeItemHeight(item.id).catch(() => Promise.resolve());
                        };
                        renderCallbacks.push(this.$vlItemClientRectQueryMap[item.id]);
                    }
                    mergeList.push(item);
                });
                renderData.$vlShowList = mergeList;
                if (!isEmptyObject(renderData)) {
                    this.setData(renderData, () => {
                        Promise.all(renderCallbacks.map((item) => item())).then(() => {
                            setTimeout(() => {
                                this.$vlUnLock();
                            });
                        });
                    });
                } else if (renderCallbacks.length) {
                    Promise.all(renderCallbacks.map((item) => item())).then(() => {
                        setTimeout(() => {
                            this.$vlUnLock();
                        });
                    });
                } else {
                    setTimeout(() => {
                        this.$vlUnLock();
                    });
                }
                mergeList.forEach((item) => {
                    this.$vlRestoreItemState(item.id);
                });
            }

            // log(
            //     "log",
            //     `${this.is}: vlIndex=${oldStart},${oldEnd} | ${this.$vlStartIndex},${this.$vlEndIndex}, pageSize=${pageSize}, allLength=${this.$vlAllList.length}, showLength=${this.data.$vlShowList.length}, start=${this.data.$vlStartPlaceholderHeight}, end=${this.data.$vlEndPlaceholderHeight}`
            // );
        },
        $vlSetItemHeight(itemId: string, height: number) {
            if (!this.$vlItemHeightMap) {
                this.$vlItemHeightMap = {};
            }
            this.$vlItemHeightMap[itemId] = height;
            this.$vlComputeShowList();
        },
        $vlSaveItemState(itemId: string, state: any, replace = false) {
            if (!this.$vlItemState) {
                this.$vlItemState = {};
            }
            if (replace || !this.$vlItemState[itemId]) {
                this.$vlItemState[itemId] = state;
            } else {
                this.$vlItemState[itemId] = {
                    ...this.$vlItemState[itemId],
                    ...state
                };
            }
        },
        $vlRestoreItemState(itemId: string) {
            if (this?.$vlItemState && this.$vlItemState[itemId] && this.$vlItemRestorePolicy) {
                this.$vlItemRestorePolicy(itemId, this.$vlItemState[itemId]);
                // delete this.$vlItemState[itemId];
            }
        }
    }
};

export default Mixin;
