import { Router } from "express";

import TMSProductAPI from './../server/lib/TMSProductAPI';

import DataModel from './../server/model/DataModel';

const router = new Router();

router.get('/shopHome', async (req, res, next) => {
    try{
        let [rs] = [{}];

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

        // console.log(rs.category[0].productList);
        res.render('shop/shopHome', rs);
    }catch (e){
        console.log('-----e:/shopHome-----');
        console.log(e);
    }
});


router.get('/productDetail/:code', async (req, res, next) => {
    try{
        let [rs,code] = [{},req.params.code];

        rs.productInfo = await TMSProductAPI('get_product',{code:code});

        rs.title = rs.productInfo.name;

        res.render('shop/productDetail', rs);
    }catch (e){
        console.log('-----e:/productDetail-----');
        console.log(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;