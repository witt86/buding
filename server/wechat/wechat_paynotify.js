import express from 'express';
import * as Payment from './../model_inner/Payment';

var router = express.Router();

// 支付结果异步通知
router.post('/pay', global.wxpay.useWXCallback((msg, req, res, next)=>{
    // 处理商户业务逻辑
    // { appid: 'wx27cc67276705db51',
    //  biank_type: 'CFT',
    //  cash_fee: '1',
    //  fee_type: 'CNY',
    //  is_subscribe: 'Y',
    //  mch_id: '1316943601',
    //  nonce_str: 'ZM6IZIeOlASmN8iD9cgrMhNZYJDoKzip',
    //  opend: 'oM9lkwy1LiI_NF-xz3fvt03F8t7Y',
    //  out_trade_no: 'D160328BL7VWM_3911520175',
    //  result_code: 'SUCCESS',
    //  return_code: 'SUCCESS',
    //  sign: '8F1DB72EB3333EECCA024103AA692E26',
    //  time_end: '20160328185642',
    //  total_fee: '1',
    //  trade_type: 'JSAPI',
    //  transaction_id: '4002522001201603284351966361'
    // }
    Payment.Paying_onNotify_weixin(msg, (err, result)=>{
        if(err){
            console.log(err);
        }
        console.log(result);
        if(err==null){
            res.success();
        }else {
            res.fail();
        }
    });
}));


module.exports = router;