import request from 'request';
import Promise from 'bluebird';
import _config from '../../config.js';
import fs from 'fs';

Promise.promisifyAll(request);

const paramError = new Error('缺少参数');

export default async (method, params) => {
    let body_copy;
    try {
        if (!method)throw '方法名不允许为空';
        if (!params)throw '查询参数不允许为空';
        if (!params.size) {
            params.size = 50;
        }
        const {user, selleruser, req,...paramsOthers} = params;
        var query = {
            url: _config.thmall.apiURL + method,
            form: paramsOthers
        }
        let {body, httpResponse} =await request.postAsync(query);
        if (process.env.NODE_ENV != "production") {
            console.dir(`tms result from(${query.url}):  ${JSON.stringify(paramsOthers)}`);
        }
        body_copy = body;
        let bodyresult = JSON.parse(body);
        if (bodyresult.error) {
            if (bodyresult.err_code && bodyresult.err_code!='0')
            throw {error:bodyresult.error,err_code:bodyresult.err_code  };
            else
            throw bodyresult.error;
        }
        else {
            return bodyresult;
        }
    } catch (err) {
        console.error(`tms.${method} 接口调用错误:${err}, params:${JSON.stringify(params)}`);
        if (process.env.NODE_ENV != "production") {
           // fs.writeFile("data/error_logs/" + new Date().getTime() + "error.html", body_copy);
        }
        console.error(err);
        throw err;
    }
};