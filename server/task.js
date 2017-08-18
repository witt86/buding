import {ProductSync} from './script/ProductSync';


(()=> {
    //商品, 每分钟同步一次
    setTimeout(function () {
        ProductSync();
        setInterval(ProductSync, 120 * 1000);
    }, 1 * 1000);
    console.dir('后台任务开始运行 。。。。。。')
})();
