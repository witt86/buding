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

router.get('/:shopcode', async (req, res, next) => {
    try{
        let [rs] = [{}];
        const { shopcode }=req.params;
        rs.title = '布丁酒店';

        rs.activityProducts = await DataModel.ProductSource.findAll({
            where:{
                tags:{
                    like:'%布丁首页%'
                }
            },
            limit:4
        });

        let categorys = await DataModel.ProductCategory.findAll();
        categorys = JSON.parse(JSON.stringify(categorys));
        for(let category of categorys){
            category.products = await DataModel.ProductSource.findAll({
                where:{
                    productcategoryId:category.id,
                    status:1
                },
                limit:5
            });
        }
        rs.sections = categorys;
        rs.shopcode=shopcode;
        res.render('shop/shopHome', rs);
    }catch (e){
        console.error('-----e:/shopHome-----');
        console.error(e);
    }
});


router.get('/:shopcode/productDetail/:code', async (req, res, next) => {
    try{
        let [rs,code,shopcode] = [{},req.params.code,req.params.shopcode];

        rs.productInfo = await TMSProductAPI('get_product',{code:code});

        rs.title = rs.productInfo.name;

        rs.shopcode=shopcode;

        res.render('shop/productDetail', rs);
    }catch (e){
        console.error('-----e:/productDetail-----');
        console.error(e);
    }
});

router.get('/:shopcode/ordersettle', async (req, res, next) => {
    try{
        let [rs,shopcode] = [{},req.params.shopcode];
        rs.title="填写订单";
        rs.shopcode=shopcode;
        res.render('shop/orderSettle', rs);
    }catch (e){
        console.error('-----e:/ordersettle-----');
        console.error(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;