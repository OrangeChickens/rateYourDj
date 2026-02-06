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
async function uploadToOSS(file, filename) {
  const client = createOSSClient();

  // 构建文件路径：dj-photos/2024/02/filename.jpg
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const objectName = `dj-photos/${year}/${month}/${filename}`;

  try {
    // 上传文件
    const result = await client.put(objectName, file.path);

    // 返回可访问的URL
    // 如果配置了自定义域名，使用自定义域名；否则使用OSS默认域名
    const cdnDomain = process.env.OSS_CDN_DOMAIN;
    if (cdnDomain) {
      return `https://${cdnDomain}/${objectName}`;
    } else {
      return result.url;
    }
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error('图片上传失败');
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
