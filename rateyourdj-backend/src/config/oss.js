const OSS = require('ali-oss');

// 创建OSS客户端
function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION || 'oss-cn-shanghai',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
  });
}

// 上传文件到OSS
async function uploadToOSS(file, filename, djName = 'unknown', djLabel = 'independent') {
  console.log('🔧 创建OSS客户端...');
  console.log('  - Region:', process.env.OSS_REGION);
  console.log('  - Bucket:', process.env.OSS_BUCKET);
  console.log('  - AccessKeyId:', process.env.OSS_ACCESS_KEY_ID ? '已配置' : '未配置');

  const client = createOSSClient();

  // 清理DJ名字和厂牌，移除特殊字符，用于文件路径
  const safeDjName = djName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '_');
  const safeDjLabel = djLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '_');

  // 构建文件路径：dj-photos/厂牌/DJ名字/2024-02-06_filename.jpg
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}-${day}`;

  const objectName = `dj-photos/${safeDjLabel}/${safeDjName}/${datePrefix}_${filename}`;

  console.log('📂 OSS路径:', objectName);
  console.log('📄 本地文件:', file.path);

  try {
    // 上传文件
    console.log('⏳ 开始上传到OSS...');
    const result = await client.put(objectName, file.path);
    console.log('✅ OSS上传成功');
    console.log('  - OSS返回URL:', result.url);

    // 返回可访问的URL
    // 如果配置了自定义域名，使用自定义域名；否则使用OSS默认域名
    const cdnDomain = process.env.OSS_CDN_DOMAIN;
    let finalUrl;

    if (cdnDomain) {
      finalUrl = `https://${cdnDomain}/${objectName}`;
      console.log('  - 使用CDN域名:', finalUrl);
    } else {
      // 强制使用HTTPS（微信小程序要求）
      // OSS默认返回HTTP，需要手动替换为HTTPS
      finalUrl = result.url.replace('http://', 'https://');
      console.log('  - 使用OSS默认域名(HTTPS):', finalUrl);
    }

    return finalUrl;
  } catch (error) {
    console.error('❌ OSS上传失败:', error);
    console.error('  - 错误信息:', error.message);
    console.error('  - 错误代码:', error.code);
    throw new Error('图片上传失败: ' + error.message);
  }
}

// 删除OSS文件
async function deleteFromOSS(objectName) {
  const client = createOSSClient();

  try {
    await client.delete(objectName);
    return true;
  } catch (error) {
    console.error('OSS删除失败:', error);
    return false;
  }
}

module.exports = {
  createOSSClient,
  uploadToOSS,
  deleteFromOSS
};
