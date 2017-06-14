function addShopCar(code) {
    ApiInvoke('shop','addShopCar',{code:code},function (err,result) {
        if(err){
            $('#errorMsg').text(err);
            $('#errorDialog').fadeIn(200);
            return false;
        }

        $('#shopCarDot').css('display','block');
        $('#shopCarDot').html(parseInt($('#shopCarDot').html()) + 1);
        setTimeout(
            function () {
                $('#shopCarIcon').animate({
                    height:'40px'
                },300)
            },300
        );
        setTimeout(
            function () {
                $('#shopCarIcon').animate({
                    height:'28px'
                },300)
            },600
        );
    });
}

function afterShare() {
    $('#shareDialog').fadeOut(200);
}

function ApiInvoke_appglobal() {
    var params = ["appglobal"];
    for (var i = 0; i < arguments.length  ; i++) {
        params.push(arguments[i]);
    }
    ApiInvoke_inner.apply(window, params);
}

function ApiInvoke(apiRoot,method,data,callback) {
    if(arguments.length<4) {
        callback('缺少基本参数', null);
        return;
    }
    if($.showLoading){
        $.showLoading("处理中...");
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
            if ($.hideLoading) {
                $.hideLoading();
            }
        }
    });
}