const consoleType = {
    0: 'log',
    1: 'info',
    2: 'warn',
    3: 'error'
};
Component({
    data: {
        requesting: false,
        message: 'hi demo',
        tabs: [
            {
                name: '1',
                value: '1'
            },
            {
                name: '2',
                value: '2'
            }
        ],
        name: 456,
        val: {
            age: 123
        }
    },
    created() {
        this.storageIndex = 0;
        this.requestType = 0;
        this.consoleType = 0;
    },
    methods: {
        callWxMethod(e) {
            const method = e.currentTarget.dataset.method;
            if (method === 'console') {
                console[consoleType[this.consoleType]](
                    this.consoleType === 3 ? new Error(Date.now()) : Date.now(),
                    global
                );
                xhs.showToast({
                    title: `已打印console.${consoleType[this.consoleType]}，请前往Console查看`,
                    icon: 'none'
                });
                this.consoleType++;
                this.consoleType = this.consoleType > 3 ? 0 : this.consoleType;
                return;
            }
            if (method === 'showToast') {
                xhs.showToast({
                    title: `当前时间：${new Date().toLocaleString()}`,
                    icon: 'none'
                });
                return;
            }
            if (method === 'setStorageSync') {
                this.storageIndex++;
                const key = `s${this.storageIndex}`;
                xhs.setStorageSync(key, this.storageIndex % 2 === 0 ? Date.now() : { value: Date.now() });
                xhs.showToast({
                    title: `已设置「${key}」的数据，请前往Storage查看`,
                    icon: 'none'
                });
                return;
            }
            if (method === 'getStorage') {
                xhs.getStorage({
                    key: `s${this.storageIndex}`,
                    success: (res) => {
                        xhs.showToast({
                            title: `获取内容：${res.data}`,
                            icon: 'none'
                        });
                        console.log('getStorage success=', res);
                    },
                    fail: (res) => {
                        xhs.showToast({
                            title: `获取失败：${res.errMsg}`,
                            icon: 'none'
                        });
                        console.error('getStorage fail=', res);
                    }
                });
                return;
            }
            if (method === 'removeStorage') {
                const k2 = `s${this.storageIndex}`;
                xhs.removeStorage({
                    key: k2,
                    success: () => {
                        xhs.showToast({
                            title: `已删除「${k2}」的数据`,
                            icon: 'none'
                        });
                        console.log('removeStorage success');
                    },
                    fail: (res) => {
                        xhs.showToast({
                            title: `删除失败：${res.errMsg}`,
                            icon: 'none'
                        });
                        console.error('removeStorage fail=', res);
                    }
                });
                return;
            }
            if (method === 'request') {
                if (this.data.requesting) {
                    return;
                }
                this.setData({
                    requesting: true
                });
                const done = (res, fail) => {
                    this.requestType++;
                    this.requestType = this.requestType > 2 ? 0 : this.requestType;
                    console[fail ? 'error' : 'log'](`请求：${fail ? '失败' : '成功'}`, res);
                    this.setData({
                        requesting: false
                    });
                };
                const typeConfig = {
                    0: {
                        // 请求随机文案，仅供演示，请勿商用，感谢免费接口调用服务商，文档：https://api.uomg.com/doc-rand.avatar.html
                        url: 'https://api.uomg.com/api/rand.avatar?sort=%E5%A5%B3&format=json',
                        method: 'GET'
                    },
                    1: {
                        // 请求随机图片，仅供演示，请勿商用，感谢免费接口调用服务商，文档：https://api.uomg.com/doc-rand.qinghua.html
                        url: 'https://api.uomg.com/api/rand.qinghua',
                        method: 'POST',
                        data: {
                            format: 'json'
                        }
                    },
                    2: {
                        // 模拟接口报错情况，感谢免费接口调用服务商，文档：https://api.uomg.com/doc-rand.qinghua.html
                        url: 'https://api.uomg.com/api2222/rand.qinghua22222',
                        method: 'POST',
                        data: {
                            format: 'json'
                        }
                    }
                };
                xhs.request({
                    ...typeConfig[this.requestType],
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
