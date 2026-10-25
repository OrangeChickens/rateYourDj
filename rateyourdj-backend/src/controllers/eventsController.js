const Events=require('../models/Events');
const {id}=require('../utils/djContent');
const handler=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
exports.list=handler(async(req,res)=>res.json({success:true,...await Events.list(req.query)}));
exports.cities=handler(async(req,res)=>res.json({success:true,data:await Events.cities()}));
exports.detail=handler(async(req,res)=>res.json({success:true,data:await Events.detail(id(req.params.id))}));
