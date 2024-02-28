const { version } = require('../../weconsole/main/index');
Page({
    data: {
        version,
        message: 'hi WeConsole',
        enableDebug: wx.getSystemInfoSync().enableDebug
    },
    copy(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.url
        });
    },
    toggleDebug() {
        wx.setEnableDebug({
            enableDebug: !this.data.enableDebug
        });
    }
});
