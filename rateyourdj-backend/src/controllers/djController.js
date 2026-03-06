const DJ = require('../models/DJ');

// 获取DJ列表
async function getDJList(req, res, next) {
  try {
    const filters = {
      city: req.query.city,
      style: req.query.style,
      letter: req.query.letter,
      sort: req.query.sort || 'overall_rating',
      order: req.query.order || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await DJ.getList(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取DJ详情
async function getDJDetail(req, res, next) {
  try {
    const { id } = req.params;

    const dj = await DJ.findById(id);

    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    res.json({
      success: true,
      data: dj
    });
  } catch (error) {
    next(error);
  }
}

// 搜索DJ
async function searchDJs(req, res, next) {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DJ.search(keyword, page, limit);

    // 保存搜索历史（如果用户已登录）
    if (req.user) {
      const { pool } = require('../config/database');
      await pool.query(
        'INSERT INTO search_history (user_id, keyword) VALUES (?, ?)',
        [req.user.userId, keyword]
      );
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取热门DJ
async function getHotDJs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const djs = await DJ.getHotDJs(limit);

    res.json({
      success: true,
      data: djs
    });
  } catch (error) {
    next(error);
  }
}

// 获取所有城市
async function getCities(req, res, next) {
  try {
    const cities = await DJ.getCities();

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
}

// 获取所有厂牌
async function getLabels(req, res, next) {
  try {
    const labels = await DJ.getLabels();

    res.json({
      success: true,
      data: labels
    });
  } catch (error) {
    next(error);
  }
}

// 创建DJ（仅管理员）
async function createDJ(req, res, next) {
  try {
    const { name, city, label, music_style, photo_url, bio } = req.body;

    console.log('🎵 创建DJ请求:');
    console.log('  - 名称:', name);
    console.log('  - 城市:', city);
    console.log('  - 厂牌:', label || '无');
    console.log('  - 音乐风格:', music_style || '无');
    console.log('  - 照片URL:', photo_url || '无');

    // 验证必填字段
    if (!name || !city) {
      console.log('❌ 缺少必填字段');
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：name 和 city'
      });
    }

    // 创建DJ
    console.log('💾 开始保存到数据库...');
    const dj = await DJ.create({
      name,
      city,
      label: label || null,
      music_style: music_style || null,
      photo_url: photo_url || null,
      bio: bio || null
    });

    console.log('✅ DJ创建成功:', dj.id);
    console.log('  - 保存的photo_url:', dj.photo_url);

    res.json({
      success: true,
      message: 'DJ创建成功',
      data: dj
    });
  } catch (error) {
    console.error('❌ 创建DJ失败:', error);
    next(error);
  }
}

// 更新DJ（仅管理员）
async function updateDJ(req, res, next) {
  try {
    const { id } = req.params;
    const { name, city, label, music_style, photo_url, bio } = req.body;

    console.log('🎵 更新DJ请求:');
    console.log('  - ID:', id);
    console.log('  - 名称:', name);
    console.log('  - 城市:', city);
    console.log('  - 厂牌:', label || '无');
    console.log('  - 音乐风格:', music_style || '无');
    console.log('  - 照片URL:', photo_url || '无');

    // 验证必填字段
    if (!name || !city) {
      console.log('❌ 缺少必填字段');
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：name 和 city'
      });
    }

    // 检查DJ是否存在
    const existingDJ = await DJ.findById(id);
    if (!existingDJ) {
      console.log('❌ DJ不存在');
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    // 更新DJ
    console.log('💾 开始更新到数据库...');
    const dj = await DJ.update(id, {
      name,
      city,
      label: label || null,
      music_style: music_style || null,
      photo_url: photo_url || null,
      bio: bio || null
    });

    console.log('✅ DJ更新成功:', dj.id);
    console.log('  - 保存的photo_url:', dj.photo_url);

    res.json({
      success: true,
      message: 'DJ更新成功',
      data: dj
    });
  } catch (error) {
    console.error('❌ 更新DJ失败:', error);
    next(error);
  }
}

// 用户提交DJ（待审核）
async function submitDJ(req, res, next) {
  try {
    const { name, city, label, music_style, photo_url, bio } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：name 和 city'
      });
    }

    const dj = await DJ.submit({
      name,
      city,
      label: label || null,
      music_style: music_style || null,
      photo_url: photo_url || null,
      bio: bio || null,
      submitted_by: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: '提交成功，等待审核',
      data: dj
    });
  } catch (error) {
    next(error);
  }
}

// 获取待审核DJ列表（管理员）
async function getPendingDJs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DJ.getPending(page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 审核通过DJ（管理员）
async function approveDJ(req, res, next) {
  try {
    const { id } = req.params;

    const dj = await DJ.findById(id);
    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    const updated = await DJ.updateStatus(id, 'approved');

    res.json({
      success: true,
      message: '审核通过',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

// 拒绝DJ（管理员）
async function rejectDJ(req, res, next) {
  try {
    const { id } = req.params;

    const dj = await DJ.findById(id);
    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    const updated = await DJ.updateStatus(id, 'rejected');

    res.json({
      success: true,
      message: '已拒绝',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDJList,
  getDJDetail,
  searchDJs,
  getHotDJs,
  getCities,
  getLabels,
  createDJ,
  updateDJ,
  submitDJ,
  getPendingDJs,
  approveDJ,
  rejectDJ
};
