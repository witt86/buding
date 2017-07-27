import {Router} from 'express';
import * as types from './../server/constants';
import TMSProductAPI from './../server/lib/TMSProductAPI';
import * as DataModel from './../server/model/DataModel';
import _config from './../config.js' ;
const router=new Router();

router.all("*", async(req, res, next)=> {
  if (!req.session.user) {
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

router.get('/myshop',async (req,res,next)=>{
     try {
       const user=req.session.user;
       const myshop=await TMSProductAPI('bd_query_shops',{ uid:user.uid });
       if (myshop && myshop.shops && myshop.shops.length>0){
         res.redirect(`/shop/${ myshop.shops[0] }`);
       }else {
         res.alert(types.ALERT_WARN, "您还未注册店铺", " ");
       }
     }catch (e){
       res.alert(types.ALERT_WARN, e, " ");
     }
});

router.get('/saleshop',async (req,res,next)=>{
  try {
    const user=req.session.user;
    //获得用户身份
    const bduser=await TMSProductAPI('bd_get_user',{ uid:user.uid });

    //判断是不是布丁员工
    let identity=0;
    if (bduser && bduser.length>0){
       identity=bduser[0];
    };

    //去哪个店?
    let shopcode=_config.officialShopcode;//默认店铺
    if (identity){
      shopcode=identity.shopcode;
    }else {
       const userShopcodes=await DataModel.User_ShopCode.findAll({
           where:{
             uid:user.uid
           },
           order: [["createdAt","DESC"]]
       });
       if (userShopcodes && userShopcodes.length>0){
          shopcode=userShopcodes[0].shopcode;
       }
    }
    res.redirect(`/shop/${ shopcode }`);
  }catch (e){
    res.alert(types.ALERT_WARN, e, " ");
  }
});

router.all('/error', async (req, res, next) => {
  res.render('/error');
});



module.exports = router;