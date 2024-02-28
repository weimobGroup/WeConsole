const { version } = require('../../weconsole/main/index');
Page({
    data: {
        version,
        message: 'hi WeConsole',
        pkShow: false
    },
    copy(e) {
        wx.setClipboardData({
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
