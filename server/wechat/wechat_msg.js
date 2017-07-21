import { Router } from 'express';
import wechat from 'wechat';
import {sortBy} from 'lodash';
import fs from 'fs';
import _config from './../../config.js';
import * as DataModel from './../model/DataModel';

const router = new Router();
// 微信输入信息都在req.weixin上
const handleMessage_text = wechat( _config.wxconfig, async function (req,res,next){
    const  MsgType=req.weixin.MsgType;
    const  text=req.weixin.Content;
    try {
        if (MsgType=='text') {

        } else {
            next();
        }
    }catch (e){
        console.error('-------handleMessage_text:error------');
        console.error(e);
        next();
    }
});
const handleMessage_event = wechat( _config.wxconfig, function (req,res,next){
    console.info("handleMessage_first: " + req.weixin);
    const  MsgType=req.weixin.MsgType;
    const  Event=req.weixin.Event;
    if (MsgType=='event'){
        if (Event=='subscribe'|| Event=='SCAN') {// 关注事件  "SCAN"表示用户已关注公众号，其扫二维码时消息推送
            //关注时，处理关注事件的订阅者，调用
            if (Event == "subscribe") {

            }
            if (req.weixin.EventKey) {   //接收用户扫二维码微信推送消息
                //扫二维码事件处理
                delayRun(()=>{
                    MsgHandle.QRCodeMsgHandle(req,res).then(result=>{
                    }).catch(e=>{
                        console.error(`扫二维码事件处理错误:${e}`);
                    });
                },10);
                let scan_id='';
                const  EventKey=req.weixin.EventKey||'';
                if (Event=='subscribe'){//未关注时扫二维码
                    scan_id=EventKey.replace('qrscene_','');
                }
                else if (Event=='SCAN'){//已关注时扫二维码
                    scan_id=EventKey;
                }
                if (scan_id&&scan_id.indexOf('invite')>=0){
                    return;
                }
            }
            else {                    //接收用户直接关注时微信推送消息
                delayRun(() => {
                    MsgHandle.SubscribeMsgHandle(req).then(result => {
                        console.log("用户关注消息处理结果:");
                        console.log(result);
                    }).catch(e => {
                        console.error(`用户取关消息处理错误:${JSON.stringify(e)}`);
                    });
                }, 10);
            }
        }
        else if (Event=='unsubscribe'){//取关事件
            delayRun(()=>{
                MsgHandle.UnSubscribeMsgHandle(req).then(result=>{
                    console.log("用户取关消息处理结果:");
                    console.log(result);
                }).catch(e=>{
                    console.error(`用户取关消息处理错误:${JSON.stringify(e)}`);
                });
            },10);
        }
        else {
            console.log("--------微信其他事件--------");
            console.log(Event);
            res.reply();
            return;
        }
        res.reply();
    }else {
        next();
    }
    res.reply(Event);
    next();
});

const handleMessage_voice = wechat( _config.wxconfig, async (req,res,next)=>{
    // const  MsgType = req.weixin.MsgType;
    // const  MediaId = req.weixin.MediaId;
    // const  ThumbMediaId = req.weixin.ThumbMediaId;
    // const  FromUserName = req.weixin.FromUserName;
    // try {
    //     if (MsgType=='video') {
    //         const user = await DataModel.WxUser.findOne({
    //             where:{
    //                 wx_openID:FromUserName
    //             }
    //         });
    //         if(!user) res.reply(`未知的用户信息`);
    //
    //         const buffer = await global.wechat_api.getMediaAsync(MediaId);
    //         fs.writeFile('public/video/' + MediaId +'.mp4',buffer,async (err,result) => {
    //             if(err) console.log(err);
    //             console.log('video saved');
    //         });
    //
    //         const bufferThumb = await global.wechat_api.getMediaAsync(ThumbMediaId);
    //         fs.writeFile('public/video/' + ThumbMediaId +'.jpg',bufferThumb,async (err,result) => {
    //             if(err) console.log(err);
    //             console.log('thumb saved');
    //         });
    //
    //         const hex_id = new Date().getTime() + Math.round( 100 * Math.random() );
    //         await DataModel.GiftQR.create({
    //             hex_id:hex_id,
    //             type:2,
    //             video:MediaId,
    //             video_key:ThumbMediaId
    //         });
    //
    //         res.reply(`http://haoli.yichihui.com/activity/giftQR/${hex_id}`);
    //     } else {
    //         next();
    //     }
    // }catch (e){
    //     console.error('-------handleMessage_text:error------');
    //     console.error(e);
    //     next();
    // }
    next();
});

const handleMessage_video = wechat( _config.wxconfig, async (req,res,next)=>{
    const  MsgType = req.weixin.MsgType;
    const  MediaId = req.weixin.MediaId;
    const  ThumbMediaId = req.weixin.ThumbMediaId;
    const  FromUserName = req.weixin.FromUserName;
    try {
        if (MsgType=='video') {
            const user = await DataModel.WxUser.findOne({
                where:{
                    wx_openID:FromUserName
                }
            });
            if(!user) res.reply(`未知的用户信息`);

            const buffer = await global.wechat_api.getMediaAsync(MediaId);
            fs.writeFile('public/uploads/' + MediaId +'.mp4',buffer,async (err,result) => {
                if(err) console.log(err);
                console.log('video saved');
            });

            const bufferThumb = await global.wechat_api.getMediaAsync(ThumbMediaId);
            fs.writeFile('public/uploads/' + ThumbMediaId +'.jpg',bufferThumb,async (err,result) => {
                if(err) console.log(err);
                console.log('thumb saved');
            });

            const hex_id = new Date().getTime() + Math.round( 100 * Math.random() );
            await DataModel.GiftQR.create({
                hex_id:hex_id,
                type:2,
                video:MediaId,
                video_key:ThumbMediaId,
                status:0
            });

            res.reply(`http://haoli.yichihui.com/activity/giftQR/${hex_id}`);
        }else if(MsgType == 'image'){
            const user = await DataModel.WxUser.findOne({
                where:{
                    wx_openID:FromUserName
                }
            });
            if(!user) res.reply(`未知的用户信息`);

            const buffer = await global.wechat_api.getMediaAsync(MediaId);
            fs.writeFile('public/uploads/' + MediaId +'.jpg',buffer,async (err,result) => {
                if(err) console.log(err);
                console.log('image saved');
            });

            const hex_id = new Date().getTime() + Math.round( 100 * Math.random() );
            await DataModel.GiftQR.create({
                hex_id:hex_id,
                type:2,
                pic:MediaId,
                status:0
            });

            res.reply(`http://haoli.yichihui.com/activity/giftQR/${hex_id}`);
        }else {
            next();
        }
    }catch (e){
        console.error('-------handleMessage_video:error------');
        console.error(e);
        next();
    }
});

const handleMessage_end = wechat( _config.wxconfig, function (req,res,next){
    res.reply();
});

router.all('/*', handleMessage_text, handleMessage_event, handleMessage_voice, handleMessage_video, handleMessage_end);

export default router;