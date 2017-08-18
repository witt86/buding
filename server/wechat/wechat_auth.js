import { Router } from 'express';
import Promise from 'bluebird';
import OAuth from 'wechat-oauth';
import  _config from './../../config.js';
import  * as User from './../model/User.js';

const router = new Router();

const tokenKey_auth_pref = "oauth_";

/* 多核运行时的token跨进程共享 */
const oauthApi = new OAuth(_config.wxconfig.appid, _config.wxconfig.secret,async function (openid, callback) {
    // 传入一个根据openid获取对应的全局token的方法
    // 在getUser时会通过该方法来获取token
    console.log("----------多核运行时的token跨进程共享getAsync：openid---------");
    console.log(openid);
    const token= await global.redisClient.getAsync(tokenKey_auth_pref+ openid);
    console.log("----------多核运行时的token跨进程共享getAsync:token---------");
    console.log(token);
    callback(null,token?JSON.parse(token):null);
}, async  function (openid, token, callback) {
    // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
    // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
    // 持久化时请注意，每个openid都对应一个唯一的token!
    console.log("----------多核运行时的token跨进程共享setAsync：openid---------");
    console.log(JSON.stringify(token));
    await global.redisClient.setAsync(tokenKey_auth_pref+ openid, JSON.stringify(token));
    callback(null, true);
});
Promise.promisifyAll(oauthApi);

export const InjectSimulateUserSession = async(req, res, next) => {
    console.info('模拟微信用户。。。');
    if (process.env.WXUSER) {
        global.weixin_user = require('./../../fixture/' + process.env.WXUSER + '.json');
    } else {
        global.weixin_user = require('./../../fixture/wx_caijianbo.json');
    }
    //获取微信用户身份，绑定土猴身份信息
    const userInfo = await User.findAndCreateUserFromWeixinAuthor(global.weixin_user);
    req.session.user = userInfo.get();
    console.info("session内模拟用户信息：" + JSON.stringify(req.session.user));
    next();
};

//全局拦截请求,注入微信身份验证. 并实现"身份登录"
router.all('*', async function(req, res, next) {
    if (req.originalUrl.lastIndexOf(".js") > -1) {
        console.dir("wechat-auth skip ..... " + req.originalUrl);
        next();
        return;
    }
    //已经存在session
    if(req.session.user && req.session.user.uid) {
        if(process.env.NODE_ENV!='production'){
            console.info('已经存在session. .....' + req.session.user.uid);
        }
        next();
        return;
    }
    console.info('need loading weixin auth. .....' + req.originalUrl);
    if (process.env.DEBUG) {
        try {
            await InjectSimulateUserSession(req, res, next);
        } catch (err) {
            console.log(err);
            res.json(err);
        }
        return;
    }

    const {code} = req.query;
    const {state} = req.query;
    let needGoAuthorizeURL = false;
    if(state) {
        //state过期
        const state_valid = await global.redisClient.getAsync("oauth_state_" + state);
        if (!state_valid) {
            needGoAuthorizeURL = true;
        }
    }
    if(!code || needGoAuthorizeURL) {
        let url =  _config.sitehost + req.originalUrl;
        console.log(`----url:${url}---`);
        //抹掉url中多余的from和isappinstalled参数
        const url_items = url.split("?");
        if (url_items.length > 1) {
            url_items[1] = url_items[1].replace(/from=.*?[&|$]/igm, "").replace(/isappinstalled=.*?[&|$]/igm, "");
            url = url_items.join("?");
        }
        const stateNew = Math.round(Math.random() * 1000);
        const cacheKey = "oauth_state_" + stateNew;
        await global.redisClient.setAsync("oauth_state_" + stateNew, "1");
        await global.redisClient.expireAsync(cacheKey, 60);//60秒后state过期
        const url2 = oauthApi.getAuthorizeURL(encodeURI(url), stateNew, 'snsapi_userinfo');
        console.dir(`微信回调URL....${url2}`);
        res.redirect(url2);
    } else {
        try {
            console.log("--------tAccessTokenResult----------");
            const tAccessTokenResult = await oauthApi.getAccessTokenAsync(code);
            console.info("getAccessToken ........... " + JSON.stringify(tAccessTokenResult));
            const {data:AccessTokenInfo}  = tAccessTokenResult;
            const {access_token:accessToken} = AccessTokenInfo;
            req.session.accessToken = accessToken;
            //获取微信用户详细信息
            const weixinUserInfo = await oauthApi.getUserAsync(AccessTokenInfo.openid);
            console.info("weixinUserInfo ........... " + JSON.stringify(weixinUserInfo));
            //获取微信用户身份，绑定土猴身份信息
            const userInfo = await User.findAndCreateUserFromWeixinAuthor(weixinUserInfo);
            req.session.user =userInfo.get();

            req.session.user.wxauth_state = state;
            req.session.user.wxauth_code = code;
            console.info(`session内用户信息建立：${req.session.user}`);
            next();
        } catch (err) {
            //可能发生code过期,通过auth验证时给state设定有效期来解决
            console.error("--------tAccessTokenResult:e----------");
            console.error(err);
            res.json(err);
        }
    }
});

export default router;