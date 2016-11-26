import express from 'express';
import IndexModel from '../models';

const router  = express.Router();

//home
router.get('/', function(req, res) {
    res.render('index', IndexModel());
});

module.exports = router;
