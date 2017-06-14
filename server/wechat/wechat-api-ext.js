var request = require('request');

module.exports = {
    planModel:false,
    addConditional:function(menuJson, callback2){
        console.info(menuJson);
        var wx_url = "https://api.weixin.qq.com/cgi-bin/menu/addconditional?access_token={ACCESS_TOKEN}";
        this.getLatestToken(function(err, result){
            if(err!=null) {
                console.error(err);
                callback2(err, null);
            }else {
                var url = wx_url.replace("{ACCESS_TOKEN}", result.accessToken);
                var reqOptions = {
                    url: url,
                    json: true,
                    body: menuJson
                };
                request.post(reqOptions, function (err2, res2, body2) {
                    callback2(err2, body2);
                });
            }
        });
    }
};
