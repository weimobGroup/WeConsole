/* eslint-disable indent */
const { replace, showWeConsole, addCustomAction } = require('./weconsole/main/index');

replace();
showWeConsole();

addCustomAction({
    id: 'vidLogs',
    title: '页面栈与进店记录',
    cases: [
        {
            id: 'pageStacks',
            button: '查看页面栈',
            showMode: 'grid',
            handler() {
                return {
                    cols: [
                        {
                            title: '序号',
                            field: 'id',
                            width: '10'
                        },
                        {
                            title: '页面及状态',
                            field: 'page',
                            width: '40'
                        },
                        {
                            title: '进店结果',
                            field: 'vid',
                            width: '50'
                        }
                    ],
                    data: Array.from({ length: 100 }).map((i, index) => {
                        return {
                            id: String(index),
                            page: `/pages/p${index}`,
                            vid:
                                index % 2 === 0
                                    ? '123\n门店1'
                                    : {
                                          tableCell: true,
                                          blocks: [
                                              {
                                                  block: true,
                                                  items: [
                                                      '门店',
                                                      {
                                                          type: 'text',
                                                          content: '='
                                                      },
                                                      {
                                                          type: 'json',
                                                          value: {
                                                              vid: 123123123,
                                                              vidType: 3,
                                                              vidName: '哈哈门店'
                                                          }
                                                      }
                                                  ]
                                              }
                                          ]
                                      }
                        };
                    })
                };
            }
        }
    ]
});

App({
    data1: global,
    data2: { name: 'weconsole' }
});

console.log('console.log 来啦');
console.error('console.error 来啦');
console.info('console.info 来啦');
console.warn('console.warn 来啦');
