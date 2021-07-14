const watch = require('watch');
const { buildFull } = require('./build');
const path = require('path');

let hasNew;
let timer;
let running;
const build = () => {
    if (running) {
        return;
    }
    running = true;
    const targetDir = path.resolve(__dirname, '../dist/full');
    console.log('开始编译');
    buildFull(targetDir)
        .then(() => {
            console.log('编译成功');
            running = false;
            if (hasNew) {
                hasNew = false;
                build();
            }
        })
        .catch((err) => {
            console.log(`编译失败：${err.message}`);
            console.error(err);
            running = false;
            if (hasNew) {
                hasNew = false;
                build();
            }
        });
};

build();

watch.watchTree(path.resolve(__dirname, '../src'), (f, curr, prev) => {
    // eslint-disable-next-line no-empty
    if (typeof f === 'object' && prev === null && curr === null) {
    } else {
        hasNew = true;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            build();
        }, 500);
    }
});
