//
//window._weixin_signInfo  在前置的动态js文件里输出
window._weixin_signInfo = window._weixin_signInfo || {};

function getMeta(name, defaultValue) {
    try {
        var ele = $('meta[name="' + name + '"]');
        return ele ? (ele[0].content || defaultValue) : defaultValue;
    } catch (err) {
        return defaultValue;
    }
}
function getPageWXShareInfo() {
    return {
        title: getMeta("wx_share_title", document.title),
        content: getMeta("wx_share_content", (document.description || document.title)),
        link: getMeta("wx_share_link", document.location.href),
        imgurl: getMeta("wx_share_imgurl", ( "http://" + document.location.host + "/images/logo_twohou.png"))
    };
}
window._weixin_shareInfo = getPageWXShareInfo();

if(typeof window._jsDebug != "undefined" && window._jsDebug==true) {
    alert( JSON.stringify(window._weixin_signInfo) );
    alert( JSON.stringify(window._weixin_shareInfo) );
}

/*通过ready接口处理成功验证*/
wx.ready(function () {

    var shareInfo = {};
    /*通过error接口处理失败验证	*/
    wx.error(function (res) {
        if(typeof window._jsDebug != "undefined" && window._jsDebug==true) {
            alert("调接口失败后的返回："+res);
        }
    });

    /*判断当前客户端版本是否支持指定JS接口*/
    wx.checkJsApi({
        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
        success: function (res) {
            /*alert("判断当前客户端版本是否支持指定JS接口:"+res);*/
            // 以键值对的形式返回，可用的api值true，不可用为false
            // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
        }
    });

    /*分享到朋友圈*/
    wx.onMenuShareTimeline({
        title: window._weixin_shareInfo.title, // 分享标题
        link: window._weixin_shareInfo.link, // 分享链接
        imgUrl: window._weixin_shareInfo.imgurl, // 分享图标
        success: function () {
            // 用户确认分享后执行的回调函数
            if(window._weixin_shareInfo.success){
                window._weixin_shareInfo.success();
            }
        },
        cancel: function () {
            // 用户取消分享后执行的回调函数
        }
    });
    /*分享给朋友*/
    wx.onMenuShareAppMessage({
        title: window._weixin_shareInfo.title, // 分享标题
        desc: window._weixin_shareInfo.content, // 分享描述
        link: window._weixin_shareInfo.link, // 分享链接
        imgUrl:window._weixin_shareInfo.imgurl, // 分享图标
        type: '', // 分享类型,music、video或link，不填默认为link
        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
        success: function () {
            // 用户确认分享后执行的回调函数
            if(window._weixin_shareInfo.success){
                window._weixin_shareInfo.success();
            }
        },
        cancel: function () {
            // 用户取消分享后执行的回调函数
        }
    });
    /*分享到QQ*/
    wx.onMenuShareQQ({
        title: window._weixin_shareInfo.title, // 分享标题
        desc: window._weixin_shareInfo.content, // 分享描述
        link: window._weixin_shareInfo.link, // 分享链接
        imgUrl: window._weixin_shareInfo.imgurl, // 分享图标
        success: function () {
            // 用户确认分享后执行的回调函数
            if(shareInfo.success){
                shareInfo.success();
            }else{
                onShareInfo_success();
            }
        },
        cancel: function () {
            // 用户取消分享后执行的回调函数
        }
    });
    /*分享到腾讯微博*/
    wx.onMenuShareWeibo({
        title: window._weixin_shareInfo.title, // 分享标题
        desc: window._weixin_shareInfo.content, // 分享描述
        link: window._weixin_shareInfo.link, // 分享链接
        imgUrl: window._weixin_shareInfo.imgurl, // 分享图标
        success: function () {
            // 用户确认分享后执行的回调函数
            shareInfo.success();
        },
        cancel: function () {
            // 用户取消分享后执行的回调函数
        }
    });

    var _hideOptionMenu = getMeta("wx_hideOptionMenu","false");
    if(_hideOptionMenu=="true") {
        wx.hideOptionMenu();
    }else {
        wx.showOptionMenu();
    }
});
/*通过config接口注入权限验证配置*/
wx.config(window._weixin_signInfo);