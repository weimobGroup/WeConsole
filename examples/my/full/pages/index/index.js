Page({
    data: {
        message: 'hi WeConsole'
    },
    demoTest(e){
      console.log('demoTest====',e);
    },
    copy(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.url
        });
    }
});
