import {Router} from 'express';

const router=new Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.redirect('/shop/shopHome');
});

router.all('/error', async (req, res, next) => {
  res.render('/error');
});



module.exports = router;