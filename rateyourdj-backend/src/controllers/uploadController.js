const path = require('path');
const fs = require('fs');
const { uploadToOSS } = require('../config/oss');

// 上传图片
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      console.log('❌ 上传失败：没有文件');
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    console.log('📤 开始上传图片:');
    console.log('  - 文件名:', req.file.filename);
    console.log('  - 大小:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('  - 类型:', req.file.mimetype);
    console.log('  - 环境:', process.env.NODE_ENV);
    console.log('  - OSS Bucket:', process.env.OSS_BUCKET || '未配置');

    let imageUrl;

    // 根据环境选择上传方式
    if (process.env.NODE_ENV === 'production' && process.env.OSS_BUCKET) {
      console.log('🚀 使用阿里云OSS上传...');

      try {
        imageUrl = await uploadToOSS(req.file, req.file.filename);
        console.log('✅ OSS上传成功:', imageUrl);

        // 删除本地临时文件
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('🗑️  已删除临时文件');
        }
      } catch (ossError) {
        console.error('❌ OSS上传失败:', ossError);
        throw new Error('图片上传到OSS失败: ' + ossError.message);
      }
    } else {
      // 开发环境：使用本地存储
      console.log('💾 使用本地存储（开发环境）');
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      console.log('✅ 本地URL:', imageUrl);
    }

    console.log('✅ 图片上传完成，返回URL');

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
    console.error('❌ 上传图片错误:', error);

    // 清理本地临时文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️  已清理临时文件');
      } catch (cleanError) {
        console.error('清理临时文件失败:', cleanError);
      }
    }

    next(error);
  }
}

module.exports = {
  uploadImage
};
