import * as DataModel from './DataModel';
import _config from './../../config.js';
import {delayRun} from './../util/util';
import * as types from './../constants';
import TMSProductAPI from '../lib/TMSProductAPI';

export const loadappStaticInfo  = async ({uid})=> {
    const user1 = await DataModel.RegUser.findOne({
        where: {
            uid: uid
        },
        include: [
            {
                model: DataModel.Seller,
                include:[
                    DataModel.SaleShop
                ],
                required: false,
            }
        ]
    });
    if (!user1)
        throw `用户不存在(uid = ${uid})`;
    return {
        user: {
            version: _config.version,
            ...user1.get()
        }
    };
};

export const loadwxJsConfig = async ({uid, pageurl, loc, req, router})=> {
    const _pageurl = (pageurl == types.GET_ON_SERVER) ? (req.get('referer') || "-") : pageurl;
    var param = {
        debug: (process.env.JSDEBUG == '1'),
        jsApiList: _config.jsApiList,
        url: _pageurl
    };
    let JsConfig = await global.wechat_api.getJsConfigAsync(param);
    JsConfig._pageurl = _pageurl;
    JsConfig._loc = loc;//客户端document.location.href的取值,用来参考
    JsConfig._referer = (req.get('referer') || "-");
    JsConfig._router = router;
    JsConfig._ready = false;
    console.dir(`loadwxJsConfig ${JSON.stringify({
        uid,
        pageurl,
        router,
        loc
    })}, referer= ${req.get('referer')}, JsConfig=${JSON.stringify(JsConfig)}`);
    return JsConfig;
};

export const setValue  = async ({uid,key,value})=> {
    const keyObj = await DataModel.UserKeyProp.findOne({where: {uid: uid, propKey: key}});
    if (keyObj) {
        return await keyObj.update({propValue: value, random: Math.floor(Math.random() * 1000000)});
    } else {
        return await DataModel.UserKeyProp.create({uid: uid, propKey: key, propValue: value});
    }
};

export const getValue  = async ({uid,key})=> {
    return await DataModel.UserKeyProp.findOne({ where:{ uid:uid,propKey:key }});
};

export const removeKey  = async ({uid,key})=> {
    return await DataModel.UserKeyProp.destroy({force: true, where:{ uid:uid,propKey:key }});
};

export const loadprovinces = async ({uid, onlyShowOpened}) => {
    const cache_key = `list-provinces-${onlyShowOpened}`;
    let cache = await global.redisClient.getAsync(cache_key);
    if (cache) {
        return JSON.parse(cache);
    }
    let query = {};
    if (onlyShowOpened) {
        query.where = {productcount: {$gt: 0}};
    }
    const provinces = await DataModel.District_ProvinceView.findAll(query);
    //
    delayRun(async()=> {
        await global.redisClient.setAsync(cache_key, JSON.stringify(provinces));
        await global.redisClient.expireAsync(cache_key, 60);
    }, 10, (err)=> {
        console.error(`保存loadprovinces的结果缓存时报错:${err}`);
    });
    return provinces;
};

//后续被load_navilinks替代
export const loadads_home = async ()=> {
    return await load_navilinks({scenario: "首页轮播"});
};

export const load_navilinks = async ({scenario,owner})=> {
    let cache_key = "result_load_navilinks";
    //优先取缓存
    let cache = await global.redisClient.getAsync(cache_key);
    if (cache) {
        return JSON.parse(cache);
    }
    try {
        let result_get_navilinks = await TMSProductAPI("get_navilinks", {scenario, owner});
        //异步存入redis缓存
        if(result_get_navilinks.length>0) {
            delayRun(async()=> {
                await global.redisClient.setAsync(cache_key, JSON.stringify(result_get_navilinks));
                await global.redisClient.expireAsync(cache_key, 60);
            }, 10, (err)=> {
                console.error(`保存首页广告 result_load_navilinks 的结果缓存时报错:${err}`);
            });
        }
        return result_get_navilinks;
    } catch (err) {
        console.error(`获取 tms.loadAdorNaviList 异常${err}`);
        return [];
    }
};