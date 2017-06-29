import { Router } from "express";
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import * as types from './../server/constants';
import * as Shop from './../server/model/Shop';
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

router.get('/mine', async (req, res, next) => {
    try{
        let rs={};
        const user=req.session.user;
        const { shopcode }=req.query;
        const reguser=await DataModel.RegUser.findOne({ where:{ uid:user.uid } });
        const orderListWaitPay=await TMSProductAPI("query_orders",{ uid:user.uid,status:0 });

        rs.title = '我的布丁';
        rs.shopcode=shopcode;
        rs.reguser=reguser;
        rs.orderListWaitPay=orderListWaitPay;

        res.render('user/mine', rs);
    }catch (e){
        console.error('-----e:/shopHome-----');
        console.error(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;