import { Router } from 'express';
import * as AppGlobal from './../server/model/AppGlobal';

const router = new Router();

router.all('*', async (req, res, next)=>{
    try{
        const referpage = req.get('referer') || "";
        const uid = 'no_use_';
        const signInfo = await AppGlobal.loadwxJsConfig({uid:uid, pageurl:referpage,req});
        var data = res.gData({signInfo: signInfo});
        res.type('application/x-javascript').render('_weixin_js_config', data);
    }catch (err) {
        console.error(`获取签名异常:${err}`);
        res.type('application/x-javascript').render('_weixin_js_config', {error: JSON.stringify(err)});
    }
});

export default router;


