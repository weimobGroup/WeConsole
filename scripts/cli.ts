import { build } from './build';

console.log('开始编译');
build()
    .then(() => {
        console.log('编译成功');
    })
    .catch((err) => {
        console.log('编译失败');
        console.error(err);
    });
