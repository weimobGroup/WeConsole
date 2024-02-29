/* eslint-disable no-var */
var inject = require('../scripts-dist/inject');
var config = inject.parseInjectConfig(process.argv);
console.log('开始注入weconsole');
inject.injectMpProject(config);
console.log('注入weconsole成功');
