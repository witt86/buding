import express from "express";
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
import _businessTool from './server/util/BusinessTool';

import moment from "moment";

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//确保只有一个进程执行token重置任务
if (process.env.NODE_APP_INSTANCE == 0 || typeof process.env.NODE_APP_INSTANCE == "undefined") {
  globals.initWeixinTokens();
}

const RedisStore = connectRedis(session);
const sessionCookieKey = "buding-" + (process.env.NODE_ENV||"production");
app.use(session({
  store: new RedisStore({
    host: "127.0.0.1",
    port: 6379
  }),
  resave:false,
  saveUninitialized: true,
  secret:"kdjcy23Yhne24*763",
  key:sessionCookieKey,
  cookie:{
    maxAge:8000 * 1000,
    httpOnly:false
  }
}));

app.locals.moment = moment;
//全局http处理函数, 用在服务器端express/ejs页面中。react产品端用不到
app.use(function(req, res, next) {
  //微信分享信息设定,如果为空,则客户端的JS会从网页基本信息中提取
  res.locals.wxshare = {
    title:"",
    content:"",
    link:"",
    imgurl:""
  };
  res.gData = function(obj){
    return _.merge( obj ,{session:req.session})
  };
  res.renderError = function(errObj){
    var data = res.gData({error:errObj, message:errObj.message||""});
    res.render("error", data);
  };
  res.alert = function(actionType, title, message, buttons) {
    var data = res.gData({actionType: actionType, title: title, message: message||"",buttons:buttons||[]});
    res.render("_alert", data);
  };
  next();
});


app.post('/xhr_wx_js_config_js', function(req, res, next) {
  try{
    // var referpage = req.get('referer')||"";
    // console.log(referpage);
    // _businessTool.get_weixin_JS_SDK_signInfo(referpage, function(err, signInfo){
    //   var data = merge({signInfo: signInfo||{}},{session:req.session});
    //   res.render('_weixin_js_config', data);
    // });
    var refer = req.body.url;
    _businessTool.get_weixin_JS_SDK_signInfo(refer, function(err, signInfo){
      var data = merge({signInfo: signInfo||{}},{session:req.session});
      res.json(data);
    });
  }catch (e){
    console.log('xhr_wx_js_config_js err');
    console.log(e);
  }
});
//api
app.use("/api",main);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//网站启动事件
delayRun(()=> {
  //OnWebSiteStartEvent(app);
}, 10, (err)=> {
  console.dir("网站启动事件运行出错:" + err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
