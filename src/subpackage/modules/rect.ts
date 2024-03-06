import { log } from '@/main/modules/util';
import { selectBoundingClientRect, type CrossMpClientRect } from 'cross-mp-power';

export const getBoundingClientRect = (ctx: any, selector: string, retryCount = 3): Promise<CrossMpClientRect> => {
    return new Promise((resolve, reject) => {
        const fire = () => {
            selectBoundingClientRect({
                selector,
                ctx,
                retryCount,
                retryDelay: 200
            })
                .then(resolve)
                .catch((err) => {
                    if (ctx.$wcComponentIsDestroyed) {
                        const err = new Error(
                            ctx.$wcComponentIsDestroyed
                                ? `组件已被销毁，无法获取元素${selector}的boundingClientRect`
                                : `无法找到元素${selector}进而获取其boundingClientRect`
                        );
                        log('log', err);
                        return reject(err);
                    }
                    reject(err);
                });
        };
        fire();
    });
};
