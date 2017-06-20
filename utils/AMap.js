

export const getGeoAdress = (callback)=> {
    if (typeof window == "undefined")
        callback('AMAP暂只支持客户端js编码', null);

    if (typeof window.AMap == "undefined")
        callback('window.AMap未初始化,请确定已加载aMap库', null);

    if (typeof navigator == "undefined")
        callback('navigator未初始化,请确定在客户端执行此脚本', null);

    if (typeof navigator.geolocation == "undefined")
        callback('navigator.geolocation未初始化,请确定在客户端执行此脚本');
    //
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(
            (position)=> {
                //可能拿不到地址
                const {coords} = position;
                if(!coords ) {
                    callback(position.toString(), null);
                    return;
                }
                const lng = parseFloat(position.coords.longitude);
                const lat = parseFloat(position.coords.latitude);
                new window.AMap.Geocoder({
                    radius: 1000
                }).getAddress([lng, lat], (status, result)=> {
                    if (status === 'complete' && result.info === 'OK') {
                        const geoinfo = {
                            address: result.regeocode.formattedAddress,
                            province: result.regeocode.addressComponent.province,
                            city: result.regeocode.addressComponent.city,
                            district: result.regeocode.addressComponent.district,
                        }
                        callback(null, geoinfo);
                    } else {
                        callback(`${status}(${result.info})`, null);
                    }
                });
            },
            (error)=> {
                console.dir(error);
                let errMsg = "";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errMsg = "用户拒绝对获取地理位置的请求。";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errMsg = "位置信息是不可用的。";
                        break;
                    case error.TIMEOUT:
                        errMsg = "请求用户地理位置超时。";
                        break;
                    case error.UNKNOWN_ERROR:
                        errMsg = "未知错误。";
                        break;
                    default:
                        errMsg = "未知错误。";
                }
                callback(null, errMsg);
            }
        );
    }
}