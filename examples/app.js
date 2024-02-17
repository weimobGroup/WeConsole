const { replace, showWeConsole } = require('./weconsole/main/index');

replace();
showWeConsole();

App({
    data1: global,
    data2: { name: 'weconsole' }
});

console.log('console.log 来啦');
console.error('console.error 来啦');
console.info('console.info 来啦');
console.warn('console.warn 来啦');
