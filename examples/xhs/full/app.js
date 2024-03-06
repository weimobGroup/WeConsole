/* eslint-disable indent */
const { replace, showWeConsole, addCustomAction } = require('./weconsole/main/index');

replace();
showWeConsole();

addCustomAction({
    id: 'customTableDemo',
    title: '自定义表格示例',
    cases: [
        {
            id: 'showList',
            button: '查看数据',
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
                            title: '页面',
                            field: 'page',
                            width: '40'
                        },
                        {
                            title: '门店',
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
                                    ? '门店信息：\n测试门店' + (index + 1)
                                    : {
                                          tableCell: true,
                                          blocks: [
                                              {
                                                  block: true,
                                                  items: [
                                                      '门店信息',
                                                      {
                                                          type: 'text',
                                                          content: '='
                                                      },
                                                      {
                                                          type: 'json',
                                                          value: {
                                                              id: index,
                                                              type: 3,
                                                              name: `测试门店${index + 1}`
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

console.log(
    '数字',
    123,
    '布尔',
    true,
    '字符串',
    '函数',
    () => {
        console.log('123');
    },
    '类',
    class Box {
        show() {
            console.log('123');
        }
    }
);
