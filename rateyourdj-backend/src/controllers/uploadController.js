const path = require('path');
const fs = require('fs');
const { uploadToOSS } = require('../config/oss');

// 上传图片
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    let imageUrl;

    // 根据环境选择上传方式
    if (process.env.NODE_ENV === 'production' && process.env.OSS_BUCKET) {
      // 生产环境：上传到阿里云OSS
      imageUrl = await uploadToOSS(req.file, req.file.filename);

      // 删除本地临时文件
      fs.unlinkSync(req.file.path);
    } else {
      // 开发环境：使用本地存储
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    // 清理本地临时文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

module.exports = {
  uploadImage
};
