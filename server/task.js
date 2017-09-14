import {ProductSync} from './script/ProductSync';
import TMSProductAPI from './lib/TMSProductAPI';
import * as globals from './global';
import _config from './../config.js' ;
import { delayRun } from './../utils/util';
//正在处理的的提现再次，发起微信提现请求
const synequestWithDrawInfo = async()=> {
    let p = 0;
    try {
        for (let i = 0, page_size = 10, withdraw_request = []; (await (async()=> {
            withdraw_request = await TMSProductAPI("query_withdraw_request", {
                uid: 'all',
                status: 0,
                pos: i,
                size: page_size
            });
            return withdraw_request.length;
        })()) > 0; i += page_size) {
            for (let withdraw of withdraw_request) {
                p++;
                try {
                    console.log(`----------------${ p }----------------`);
                    let partner_trade_no = withdraw.uid.substring(0, 20) + withdraw.id;
                    let wx_openID = withdraw.ca_no;
                    let money = withdraw.amount;
                    let PayResult;
                    if (process.env.EP == "1") {
                        PayResult = {
                            return_code: 'SUCCESS',
                            result_code: 'SUCCESS',
                            payment_no: Math.random(20) * 1000
                        }
                    } else {
                        const desc = "推广收益提现";
                        PayResult = await global.EnterprisePay(partner_trade_no, wx_openID, money);
                    }
                    //提现结果记录
                    delayRun(async()=> {
                        let q = {
                            uid: withdraw.uid,
                            id: withdraw.id,
                            result: JSON.stringify(PayResult)
                        };
                        await TMSProductAPI("result_withdraw", q);
                    }, 100, err=> {
                        console.error("---记录提现结果发生错误---");
                        console.error(err);
                    });
                    if (PayResult.return_code == 'SUCCESS' && PayResult.result_code == 'SUCCESS') {
                        let q = {
                            uid: withdraw.uid,
                            id: withdraw.id,
                            trans_no: PayResult.payment_no
                        }
                        let confirmResult = await TMSProductAPI("confirm_withdraw", q);
                        console.log("---提现成功，后台确认结果---");
                        console.log("提现openid:" + wx_openID);
                        console.log("提现金额:" + money);
                        console.log("TMS后台确认结果:" + JSON.stringify(confirmResult));
                        if (confirmResult.err) {
                            console.error("---提现成功，后台确认发生错误---");
                            console.error(confirmResult.err);
                        }
                    } else {
                        console.error("return_code:" + PayResult.return_code);
                        console.error("err_code:" + PayResult.err_code);
                    }
                } catch (e) {
                    console.error('------synequestWithDrawInfo:e----');
                    console.error(e);
                    continue;
                }
            }
        }
        console.log("----轮询结束----");
    } catch (e) {
        console.error("----------轮询未处理提现发生错误:----------");
        console.error(e);
    }
};

(()=> {
    //商品, 每分钟同步一次
    setTimeout(function () {
        ProductSync();
        setInterval(ProductSync, 180 * 1000);
    }, 1 * 1000);
    // 轮询正在处理的提现
    setTimeout(function () {
        synequestWithDrawInfo();
        setInterval(synequestWithDrawInfo, 5400 * 1000);
    }, 1 * 1000);
    console.dir('后台任务开始运行 。。。。。。')
})();
