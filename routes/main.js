import { Router } from 'express';
import ModelProxy from './../server/lib/ModelProxy';
import * as Shop from './../server/model/Shop';
import * as User from './../server/model/User';
import * as Order from './../server/model/Order';
import * as types from './../server/constants';
const router = new Router();

//本地 商城端 业务方法查询
router.use("/shop",ModelProxy(Shop,{}, async function(req,res,params) {
    const mysession =  req.session;
    if (!mysession.user){
        throw types.SESSION_TIMEOUT_PLEASE_RELOGIN;
    }else {
        params.uid = mysession.user.uid;
        params.user = mysession.user;
        return params;
    }
}));

router.use("/user",ModelProxy(User,{}, async function(req,res,params) {
    const mysession =  req.session;
    if (!mysession.user){
        throw types.SESSION_TIMEOUT_PLEASE_RELOGIN;
    }else {
        params.uid = mysession.user.uid;
        params.user = mysession.user;
        return params;
    }
}));

router.use("/order",ModelProxy(Order,{}, async function(req,res,params) {
    const mysession =  req.session;
    if (!mysession.user){
        throw types.SESSION_TIMEOUT_PLEASE_RELOGIN;
    }else {
        params.uid = mysession.user.uid;
        params.user = mysession.user;
        return params;
    }
}));

//拦截未匹配到的其他方法
router.all("*",function(req,res) {
    throw '未知api方法';
});

export default router;
