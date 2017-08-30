重置数据库
BUID=78901234 DEBUG=resetdb3 NODE_ENV=development node test/run-resetModel.js

tms同步商品
node ./server/task-run.js

标签类型：
好礼：代表该商品为好礼商品
首页：商品出现在首页
海鲜：分类标签
水果：分类标签
健康：分类标签
生态：分类标签
利男居：分类标签
采芝斋：分类标签

给用户添加模板商品
node ./test/run-addCompanyProducts.js

服务器进程启动
NODE_ENV=development  CDN=0 PORT=5000 PAY_DEBUG=1 pm2 start ./bin/www -n buding
NODE_ENV=development  pm2 start ./server/task-run.js -n bdtask