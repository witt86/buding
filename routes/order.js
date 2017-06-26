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
        rs.title="我的订单";
        rs.shopcode=shopcode;
        res.render('order/orderList', rs);
    }catch (e){
        console.error('-----e:/orderlist-----');
        console.error(e);
    }
});

router.get('/orderdetail/:orderno', async (req, res, next) => {

});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;