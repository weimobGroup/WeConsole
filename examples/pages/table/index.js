Page({
    data: {
        list: Array.from({ length: 100 }).map((i, index) => {
            return {
                id: index,
                content: Date.now(),
                rowStyle: index === 10 ? 'color:red' : ''
            };
        }),
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
    }
});
