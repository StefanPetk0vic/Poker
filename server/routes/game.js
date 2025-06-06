const express = require('express');
const router = express.Router();

const { getFreeSlots } = require('../functions/botManager');

//The URL path the client will use to call this req
router.get('/botManager', async(req, res) => {
    const { slots, pLength } = await getFreeSlots();
    res.send({slots,pLength});
})

module.exports=router;