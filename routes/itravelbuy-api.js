import { Router } from "express";
import * as OpenApiModel from "./../server/model/OpenApiModel";
import multipart from "connect-multiparty";

const router = new Router();


router.all("*",async (req, res, next)=>{
   //todo 对外api合法性验证
    next();
});
// router.get('*', async function (req, res, next) {
//     res.json({err: 'get请求方式未实现, 仅限Post方式', result: null});
// });
router.all("*",multipart(),async (req,res,next)=>{
    try{
        console.log(req.path);
        const pathItems = req.path.split("/");
        const methodName = pathItems[1] ? pathItems[1] : null;
        console.log(`methodName：${methodName}`);
        if (!OpenApiModel[methodName]) {
            throw `api请求的地址(${req.originalUrl})中不存在${methodName}方法,请确认映射的类是否正确!`;
        }
        let data=(req.query&&JSON.stringify(req.query)!='{}')?req.query: req.body;
        console.log('----reqData----');
        console.log(data);
        const result= await OpenApiModel[methodName](data);
        res.json({ err:null,result:result });
    }catch (e){
        res.json({ err:e,result:null });
    }
});

export default router;