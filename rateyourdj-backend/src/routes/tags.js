const express = require('express');
const router = express.Router();
const { getPresetTags, getDJTags } = require('../controllers/tagController');

// 获取预设标签
router.get('/presets', getPresetTags);

// 获取DJ的热门标签
router.get('/dj/:djId', getDJTags);

module.exports = router;
