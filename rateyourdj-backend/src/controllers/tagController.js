const { pool } = require('../config/database');

// 获取预设标签
async function getPresetTags(req, res, next) {
  try {
    const locale = req.headers['accept-language'] || 'zh-CN';
    const nameField = locale === 'en-US' ? 'tag_name_en' : 'tag_name';

    const [tags] = await pool.query(
      `SELECT id, ${nameField} as name, category, usage_count
       FROM preset_tags
       ORDER BY category, usage_count DESC`
    );

    // 按类别分组
    const grouped = {
      style: [],
      performance: [],
      personality: []
    };

    tags.forEach(tag => {
      grouped[tag.category].push({
        id: tag.id,
        name: tag.name,
        usage_count: tag.usage_count
      });
    });

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    next(error);
  }
}

// 获取DJ的热门标签
async function getDJTags(req, res, next) {
  try {
    const { djId } = req.params;

    const [tags] = await pool.query(
      `SELECT rt.tag_name, COUNT(*) as count
       FROM review_tags rt
       JOIN reviews r ON rt.review_id = r.id
       WHERE r.dj_id = ? AND r.status = 'approved'
       GROUP BY rt.tag_name
       ORDER BY count DESC
       LIMIT 10`,
      [djId]
    );

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPresetTags,
  getDJTags
};
