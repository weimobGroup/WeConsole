Component({
    data: {
        requesting: false,
        message: 'hi demo'
    },
    created() {
        this.storageIndex = 0;
        this.requestType = 0;
    },
    methods: {
        callWxMethod(e) {
            const method = e.currentTarget.dataset.method;
            if (method === 'showToast') {
                wx.showToast({
                    title: `当前时间：${new Date().toLocaleString()}`,
                    icon: 'none'
                });
                return;
            }
            if (method === 'setStorageSync') {
                this.storageIndex++;
                const key = `s${this.storageIndex}`;
                wx.setStorageSync(key, Date.now());
                wx.showToast({
                    title: `已设置「${key}」的数据，请前往Storage查看`,
                    icon: 'none'
                });
                return;
            }
            if (method === 'getStorage') {
                const key = `s${this.storageIndex}`;
                wx.getStorage({
                    key,
                    success: (res) => {
                        wx.showToast({
                            title: `获取内容：${res.data}`,
                            icon: 'none'
                        });
                        console.log('getStorage result=', res);
                    }
                });
                return;
            }
            if (method === 'removeStorage') {
                const key = `s${this.storageIndex}`;
                wx.removeStorage({
                    key,
                    success: () => {
                        wx.showToast({
                            title: `已删除「${key}」的数据`,
                            icon: 'none'
                        });
                        console.log('removeStorage success');
                    }
                });
                return;
            }
            if (method === 'request') {
                if (this.data.requesting) {
                    return;
                }
                this.requestType = this.requestType === 0 ? 1 : 0;
                this.setData({
                    requesting: true
                });
                const done = (res, fail) => {
                    console[fail ? 'error' : 'log'](`请求：${fail ? '失败' : '成功'}`, res);
                    this.setData({
                        requesting: false
                    });
                };
                if (this.requestType) {
                    // 请求随机图片，仅供演示，请勿商用
                    wx.request({
                        // 感谢免费接口调用服务商，文档：https://api.uomg.com/doc-rand.avatar.html
                        url: 'https://api.uomg.com/api/rand.avatar?sort=%E5%A5%B3&format=json',
                        method: 'GET',
                        success: done,
                        fail: (res) => {
                            done(res, true);
                        }
                    });
                    return;
                }
                // 请求随机文案，仅供演示，请勿商用
                wx.request({
                    // 感谢免费接口调用服务商，文档：https://api.uomg.com/doc-rand.qinghua.html
                    url: 'https://api.uomg.com/api/rand.qinghua',
                    method: 'POST',
                    data: {
                        format: 'json'
                    },
                    success: done,
                    fail: (res) => {
                        done(res, true);
                    }
                });
                return;
            }
        }
    }
});
