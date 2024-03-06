Page({
    data: {
        message: 'hi WeConsole',
        pkShow: false
    },
    copy(e) {
        xhs.setClipboardData({
            data: e.currentTarget.dataset.url
        });
    },
    pk() {
        this.setData({
            pkShow: true
        });
    },
    closePk() {
        this.setData({
            pkShow: false
        });
    }
});
