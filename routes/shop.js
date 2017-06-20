import { Router } from "express";

import DataModel from './../server/model/DataModel';

const router = new Router();

router.get('/shopHome', async (req, res, next) => {
    try{
        let [rs] = [{}];

        rs.title = '布丁酒店';

        rs.sections = [{title:'特产美食',url:'food',products:[{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532}]},
            {title:'手机数码',url:'mobile',products:[{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532}]},
            {title:'护肤用品',url:'skinCare',products:[{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532}]},
            {title:'家用电器',url:'appliance',products:[{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532},{name:'HUROM进口榨汁机',retail_price:532}]}];

        // console.log(rs.category[0].productList);
        res.render('shop/shopHome', rs);
    }catch (e){
        console.log('-----e:/shopHome-----');
        console.log(e);
    }
});

router.all("*",async (req, res, next)=> {
    res.render('unknown');
});

export default router;