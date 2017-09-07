import { Router } from "express";

import TMSProductAPI from './../server/lib/TMSProductAPI';

import _config from './../config.js' ;

import * as types from './../server/constants';
const router = new Router();

router.all("*",async (req, res, next)=>{
    if(!req.session.user) {
        const msg = "请先登录!";
        if (req.xhr) {
            res.json({err: msg, result: ""});
        } else {
            res.alert(types.ALERT_WARN, msg, " ");
        }
        return;
    }
    next();
});

router.get('/orderlist', async (req, res, next) => {
    try{
        let [rs] = [{}];
        let { fun_id,shopcode,referrer}=req.query;
        rs.title=referrer&&referrer.length>0?"我推广的订单":"我的订单";
        rs.shopcode=shopcode?shopcode:_config.officialShopcode;
        rs.fun_id=fun_id?fun_id:"newUserAllOrderList";
        rs.referrer=referrer&&referrer.length>0?referrer:"";
        res.render('order/orderList', rs);
    }catch (e){
        console.error('-----e:/orderlist-----');
        console.error(e);
    }
});

router.get('/orderdetail/:orderno', async (req, res, next) => {
    try{
        let [rs,orderno] = [{},req.params.orderno];
        let { shopcode,referrer }=req.query;
        rs.title="订单详情";
        rs.shopcode=shopcode?shopcode:_config.officialShopcode;
        rs.orderno=orderno;
        rs.referrer=referrer;
        const orderInfo=await TMSProductAPI("get_order",{ order_no:orderno });

        rs.orderInfo=orderInfo;

        res.render('order/orderDetail', rs);
    }catch (e){
        console.error('-----e:/orderDetail-----');
        console.error(e);
    }
});

router.get('/shopmanageOrderList',async (req,res,next)=>{
     try {
         let rs={};
         let { fun_id,shopcode }=req.query;
         rs.title="店铺订单";
         rs.shopcode=shopcode?shopcode:_config.officialShopcode;
         rs.fun_id=fun_id?fun_id:"awaitShipments";
         res.render('order/shopmanageOrderList',rs);
     }catch (e){
         console.error('-----e:/shopmanageOrderList-----');
         console.error(e);
         res.alert(types.ALERT_WARN, e, " ");
     }
});

router.get('/shopmanageorderdetail/:orderno', async (req, res, next) => {
    try{
        let [rs,orderno] = [{},req.params.orderno];
        let { shopcode }=req.query;
        let user=req.session.user;
        rs.title="店铺订单详情";
        rs.shopcode=shopcode?shopcode:_config.officialShopcode;
        rs.orderno=orderno;

        const orderInfo=await TMSProductAPI("get_order",{ order_no:orderno});

        rs.orderInfo=orderInfo;

        res.render('order/shopmanageOrderDetail', rs);
    }catch (e){
        console.error('-----e:/orderDetail-----');
        console.error(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;