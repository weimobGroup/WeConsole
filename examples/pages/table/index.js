/* eslint-disable indent */
Page({
    data: {
        cols: [
            {
                field: 'id',
                width: 20
            },
            {
                field: 'content',
                width: 80
            }
        ]
    },
    onLoad() {
        this.list = Array.from({ length: 100 }).map((i, index) => {
            return {
                id: index,
                content:
                    index % 2 === 0
                        ? Date.now()
                        : {
                              tableCell: true,
                              blocks: [
                                  {
                                      type: 'text',
                                      content: Date.now()
                                  },
                                  {
                                      type: 'text',
                                      content: Date.now()
                                  },
                                  {
                                      type: 'text',
                                      content: Date.now()
                                  },
                                  {
                                      type: 'text',
                                      content: Date.now()
                                  }
                              ]
                          },
                rowStyle: index === 10 ? 'color:red' : ''
            };
        });
    },
    onTableReady(e) {
        e.detail.setList(this.list);
    }
});
