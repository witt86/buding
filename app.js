import express from "express";
import * as _ from "lodash";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import connectRedis from "connect-redis";
import {merge} from 'lodash';
import {delayRun} from "./server/util/util";
import * as globals from "./server/global";
import main from './routes/main';
import wechat_auth from "./server/wechat/wechat_auth.js";
import xhr_wx_js_config from "./routes/xhr_wx_js_config";
import wxpay_notify from "./server/wechat/wechat_paynotify";
import * as types from './server/constants';
import moment from "moment";

import TMSProductAPI from './server/lib/TMSProductAPI';

import {OnWebSiteStartEvent} from './server/model/BusinessEvent';

var app = express();

import router_shop from './routes/shop';
import router_order from './routes/order';
import router_user from './routes/user';
import openid_map from "./routes/openid-map";
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//确保只有一个进程执行token重置任务
if (process.env.NODE_APP_INSTANCE == 0 || typeof process.env.NODE_APP_INSTANCE == "undefined") {
    globals.initWeixinTokens();
}

const RedisStore = connectRedis(session);
const sessionCookieKey = "buding-" + (process.env.NODE_ENV || "production");
app.use(session({
    store: new RedisStore({
        host: "127.0.0.1",
        port: 6379
    }),
    resave: false,
    saveUninitialized: true,
    secret: "kdjcy23Yhne24*763",
    key: sessionCookieKey,
    cookie: {
        maxAge: 8000 * 1000,
        httpOnly: false
    }
}));

app.locals.moment = moment;
app.locals.types = types;
app.locals._ = _;
//全局http处理函数, 用在服务器端express/ejs页面中。react产品端用不到
app.use(function (req, res, next) {
    //微信分享信息设定,如果为空,则客户端的JS会从网页基本信息中提取
    res.locals.wxshare = {
        title: "",
        content: "",
        link: "",
        imgurl: ""
    };
    res.gData = function (obj) {
        return _.merge(obj, {session: req.session})
    };
    res.renderError = function (errObj) {
        var data = res.gData({error: errObj, message: errObj.message || ""});
        res.render("error", data);
    };
    res.alert = function (actionType, title, message, buttons) {
        var data = res.gData({actionType: actionType, title: title, message: message || "", buttons: buttons || []});
        res.render("_alert", data);
    };
    next();
});

app.use("/xhr_wx_js_config_js", xhr_wx_js_config);

//接收微信的支付成功的异步通知
app.use("/wxpay_notify", wxpay_notify);

// app.get('*',wechat_auth, routes);
//api
app.use("/api", main);

//店铺
app.use("/shop", wechat_auth, router_shop);
//订单
app.use("/order", wechat_auth, router_order);
//订单
app.use("/user", wechat_auth, router_user);
//支付
app.get("/dopay/:orderId", wechat_auth, async(req, res)=> {
    const orderId = req.params.orderId;
    const {status, shopcode = "05987386"}=req.query;
    let buttons = [
        {url: '/order/orderlist', title: '我的订单'},
        {url: '/shop/' + shopcode, title: '商城首页'},
    ];
    if (status == 1 || status == 0) {
        const orderInfo = await TMSProductAPI("get_order", {order_no: orderId});
        let rs = {};
        rs.title = "支付";
        rs.shopcode = shopcode;
        rs.status = status;
        rs.orderInfo = orderInfo;
        res.render('dopay', rs);
        return;
    } else {
        if (!orderId) {
            res.alert(types.ALERT_WARN, "支付异常", "订单信息不允许为空", buttons);
        } else {
            const orderInfo = await TMSProductAPI("get_order", {order_no: orderId});
            if (!orderInfo) {
                res.alert(types.ALERT_WARN, "支付异常", "支付订单不存在", buttons);
            } else if (orderInfo.order_state != 0) {
                res.alert(types.ALERT_WARN, "支付异常", "订单已支付", buttons);
            }
            else {
                let rs = {};
                rs.title = "布丁收银台";
                rs.orderInfo = orderInfo;
                rs.shopcode = shopcode;
                rs.status = status;
                res.render('dopay', rs);
            }
        }
    }
});
//微信测试支付openId映射

app.use("/openid-map", wechat_auth, openid_map);

//清空当前访问者的session
app.get("/___clearsession", async(req, res) => {
    if (req.session.user) {
        req.session.user = null;
        console.error("___clearsession.......ok!");
    }
    res.alert(types.ALERT_SUCCESS, "您的session已清空", " ");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

//网站启动事件
delayRun(()=> {
    //OnWebSiteStartEvent();
}, 10, (err)=> {
    console.dir("网站启动事件运行出错:" + err);
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
