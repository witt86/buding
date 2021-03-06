function ApiInvoke_appglobal() {
    var params = ["appglobal"];
    for (var i = 0; i < arguments.length  ; i++) {
        params.push(arguments[i]);
    }
    ApiInvoke_inner.apply(window, params);
}

//获得用户某扩展属性值. 统一为字符串格式, 默认值为空字符串
function getKey(keyname, callback) {
    ApiInvoke_appglobal("getValue",keyname,callback);
}
//设置用户某扩展属性值
function setKey(keyname, keyvalue , callback) {
    ApiInvoke_appglobal("setValue", keyname, keyvalue, callback);
}
function ApiInvoke(apiRoot,method,data,callback) {
    if(arguments.length<4) {
        callback('缺少基本参数', null);
        return;
    }
    if($.showLoading){
        $.showLoading('处理中');
    }
    $.ajax({
        url: "/api/"+apiRoot+"/"+method,
        type: "POST",
        data: JSON.stringify({"queryObj": data}),
        contentType:'application/json',
        success: function (result, status, xhr) {
            if ($.hideLoading) {
                $.hideLoading();
            }
            callback(result.err, result.result);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.error("API 请求错误: ");
            console.error(XMLHttpRequest);
            console.error(textStatus);
            console.error(errorThrown);
            if ($.hideLoading) {
                $.hideLoading();
            }
            callback(errorThrown, null);
        },
        complete: function (XMLHttpRequest, textStatus) {
            if ($.hideLoading) {
                $.hideLoading();
            }
        }
    });
}
function ApiInvokeNoloading(apiRoot,method,data,callback) {
    if(arguments.length<4) {
        callback('缺少基本参数', null);
        return;
    }
    $.ajax({
        url: "/api/"+apiRoot+"/"+method,
        type: "POST",
        data: JSON.stringify({  "queryObj": data}),
        contentType:'application/json',
        success: function (result, status, xhr) {
            callback(result.err, result.result);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.error("API 请求错误: ");
            console.error(XMLHttpRequest);
            console.error(textStatus);
            console.error(errorThrown);
            callback(errorThrown, null);
        },
        complete: function (XMLHttpRequest, textStatus) {

        }
    });
}
function go_to(url) {
    window.location.href=url;
};
function queryParams(key,defaultvalue) {
    window._params = {};
    var url = document.location.href;
    if (document.location.href.indexOf("#") != -1) {
        url = document.location.href.split("#").shift();
    }
    var query = url.split("?");
    if (query.length > 1) {
        query = query[1];
        var paramItems = query.split("&");
        for (var i = 0; i < paramItems.length; i++) {
            var item = paramItems[i].split("=");
            window._params[item[0]] = item[1];
        }
    }
    if (key) {
        return window._params[key] || defaultvalue;
    } else {
        return window._params
    }
}

function queryUrlParams(url,key,defaultvalue) {
    var _params = {};
    var query = url.split("?");
    if (query.length > 1) {
        query = query[1];
        var paramItems = query.split("&");
        for (var i = 0; i < paramItems.length; i++) {
            var item = paramItems[i].split("=");
            _params[item[0]] = item[1];
        }
    }
    if (key) {
        return _params[key] || defaultvalue;
    } else {
        return _params
    }
}

function showchunk(chunkName,callback) {
    var currentchunk=$(".chunk"+chunkName);

    var showstatus=!currentchunk.hasClass('disnone');

    if (!showstatus){
        $(".chunk").each(function () {
            if (!$(this).hasClass("disnone")){
                $(this).addClass("disnone");
            }
        });
        currentchunk.removeClass("disnone");
    };
    if (callback)callback();
}

function wechatPay(paysignResult,callback) {
    var UA = window.navigator.userAgent;
    window.inWeixin = (UA.indexOf("MicroMessenger") != -1);
    if(window.inWeixin) {
        try {
            const wxpayargs = {
                appId: paysignResult.appId, //公众号名称，由商户传入
                timeStamp: paysignResult.timeStamp.toString(), //时间戳，自1970年以来的秒数
                nonceStr: paysignResult.nonceStr, //随机串
                package: paysignResult.package,
                signType: paysignResult.signType, //微信签名方式:
                paySign: paysignResult.paySign //微信签名
            };
            window.WeixinJSBridge.invoke('getBrandWCPayRequest', wxpayargs, callback);
        } catch (err) {
            alert(JSON.stringify(err));
        }
    }else {
        $.alert('非微信环境，无法完成支付');
    }
}
