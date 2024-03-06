import { registerClassComponent } from '@/sub/mixins/component';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import type { CrossMpClientRect } from 'cross-mp-power';
import { getSystemInfo } from 'cross-mp-power';
import { getBoundingClientRect } from '@/sub/modules/rect';

interface Data {
    innerStyle: string;
}

interface Props {
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
    containerStyle?: string;
}

interface TouchInfo {
    clientX: number;
    clientY: number;
}

type TouchEvent = MpEvent & {
    touches: TouchInfo[];
};

interface PositionInfo {
    x: number;
    y: number;
    subtractSelf?: boolean;
}

const { windowWidth, windowHeight } = getSystemInfo();

class Movable extends MpComponent<Data, Props> {
    rectQueryPromise?: Promise<CrossMpClientRect>;
    rect?: CrossMpClientRect;
    innerProps: Required<Omit<Props, 'containerStyle'>>;
    initData: Data = {
        innerStyle: ''
    };
    startPosition?: PositionInfo;
    movePosition?: PositionInfo;
    endPosition?: PositionInfo;
    firstEnd: boolean;
    isEnd?: boolean;
    properties: MpComponentProperties<Props, Movable> = {
        containerStyle: {
            type: String,
            observer() {
                this.queryRect(true);
            }
        },
        minX: {
            type: Number,
            value: 0,
            observer() {
                this.syncProps();
            }
        },
        minY: {
            type: Number,
            value: 0,
            observer() {
                this.syncProps();
            }
        },
        maxX: {
            type: Number,
            value: windowWidth,
            observer() {
                this.syncProps();
            }
        },
        maxY: {
            type: Number,
            value: windowHeight,
            observer() {
                this.syncProps();
            }
        }
    };

    attached() {
        this.syncProps();
        this.queryRect();
    }

    syncProps() {
        this.innerProps = {
            minX: this.data.minX || 0,
            minY: this.data.minY || 0,
            maxX: this.data.maxX || windowWidth,
            maxY: this.data.maxY || windowHeight
        };
    }

    queryRect(force = false) {
        if (!force && this.rectQueryPromise) {
            return this.rectQueryPromise;
        }
        this.rectQueryPromise = getBoundingClientRect(this, '.wc-movable').then((rect) => {
            this.rect = rect;

            return rect;
        });
        return this.rectQueryPromise;
    }

    touchStart(e: TouchEvent) {
        delete this.isEnd;

        if (this.rect) {
            this.startPosition = {
                x: e.touches[0].clientX - this.rect.left,
                y: e.touches[0].clientY - this.rect.top,
                subtractSelf: true
            };
            this.startPosition.subtractSelf = true;
            return;
        }
        this.startPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        this.queryRect(this.firstEnd).then(() => {
            if (this.isEnd) {
                return;
            }
            const rect = this.rect || {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };
            this.startPosition = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
                subtractSelf: true
            };
        });
    }
    fireMove() {
        const { x, y } = this.movePosition as PositionInfo;
        const startX = (this.startPosition as PositionInfo).x;
        const startY = (this.startPosition as PositionInfo).y;

        const rect = this.rect as CrossMpClientRect;
        let { minX, maxX, minY, maxY } = this.innerProps;
        maxX -= rect.width;
        maxY -= rect.height;

        let endX = x - startX <= minX ? minX : x - startX;
        endX = endX > maxX ? maxX : endX;

        let endY = y - startY <= minY ? minY : y - startY;
        endY = endY > maxY ? maxY : endY;

        this.endPosition = {
            x: endX,
            y: endY
        };

        this.setData({
            innerStyle: `left:${endX}px;top:${endY}px;right:auto;bottom:auto;position:fixed;`
        });
    }
    touchMove(e: TouchEvent) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        this.movePosition = {
            x,
            y
        };

        if (this.startPosition?.subtractSelf) {
            this.fireMove();
            return;
        }
        this.queryRect().then(() => {
            if (this.isEnd) {
                return;
            }
            this.fireMove();
        });
    }
    touchEnd() {
        this.firstEnd = true;
        this.isEnd = true;
        if (this.startPosition && this.endPosition) {
            this.triggerEvent('end', JSON.parse(JSON.stringify(this.endPosition)));
        }
        delete this.startPosition;
        delete this.endPosition;
        delete this.movePosition;
    }
}

registerClassComponent(Movable);
