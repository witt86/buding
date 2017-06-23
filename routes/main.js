import { Router } from 'express';
import * as shop from '../server/model/Shop';
import ModelProxy from './../server/lib/ModelProxy';

const router = new Router();

//商店
router.use("/shop",ModelProxy(shop,{}, async function(req,res,params) {
    const mysession =  req.session;
    if (!mysession.user){
        throw '页面超时，请刷新重试';
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
