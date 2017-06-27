import { Router } from "express";

import TMSProductAPI from './../server/lib/TMSProductAPI';

import * as DataModel from './../server/model/DataModel';

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
        let [rs,shopcode] = [{},req.params.shopcode];
        let { fun_id }=req.query;
        rs.title="我的订单";
        rs.shopcode=shopcode;
        rs.fun_id=fun_id?fun_id:"newUserAllOrderList";
        res.render('order/orderList', rs);
    }catch (e){
        console.error('-----e:/orderlist-----');
        console.error(e);
    }
});

router.get('/orderdetail/:orderno', async (req, res, next) => {
    try{
        let [rs,shopcode,orderno] = [{},req.params.shopcode,req.params.orderno];
        rs.title="订单详情";
        rs.shopcode=shopcode;
        rs.orderno=orderno;

        const orderInfo=await TMSProductAPI("get_order",{ order_no:orderno });

        rs.orderInfo=orderInfo;

        res.render('order/orderDetail', rs);
    }catch (e){
        console.error('-----e:/orderDetail-----');
        console.error(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;