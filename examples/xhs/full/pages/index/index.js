Page({
    data: {
        message: 'hi WeConsole'
    },
    copy(e) {
        xhs.setClipboardData({
            data: e.currentTarget.dataset.url
        });
    }
});
