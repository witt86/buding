import { Router } from 'express';
import ModelProxy from './../server/lib/ModelProxy';

const router = new Router();

//拦截未匹配到的其他方法
router.all("*",function(req,res) {
    throw '未知api方法';
});

export default router;
