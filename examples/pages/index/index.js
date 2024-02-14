Page({
    data: {
        message: 'hi WeConsole'
    },
    copy(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.url
        });
    }
});
