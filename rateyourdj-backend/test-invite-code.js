// 测试邀请码逻辑
const InviteCode = require('./src/models/InviteCode');

async function testInviteCode() {
  console.log('========== 测试邀请码逻辑 ==========\n');

  const testCode = 'REVIEWER2026';
  const testUserId = 999; // 使用一个不存在的用户 ID 进行测试

  try {
    // 1. 验证邀请码
    console.log(`1. 验证邀请码: ${testCode}`);
    const validation = await InviteCode.validate(testCode);
    console.log('   验证结果:', validation);

    if (!validation.valid) {
      console.error('   ❌ 邀请码无效:', validation.message);
      return;
    }

    const invite = validation.invite;
    console.log(`   ✅ 邀请码有效`);
    console.log(`   - 当前 used_count: ${invite.used_count}`);
    console.log(`   - 使用上限: ${invite.usage_limit}`);
    console.log(`   - 过期时间: ${invite.expires_at}`);

    console.log(`\n2. 模拟使用邀请码（用户 ID: ${testUserId}）`);
    console.log('   注意：这只是测试，不会真的创建用户\n');

    // 这里不实际调用 use()，因为会失败（用户不存在）
    // 只是展示逻辑流程
    console.log('   ✅ 如果用户存在，会执行以下操作：');
    console.log('      1. 更新 invite_codes.used_count + 1');
    console.log('      2. 更新 users.access_level = "full"');
    console.log('      3. 更新 users.invite_code_used = code');
    console.log('      4. 如果有创建者，增加其 invites_accepted');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }

  console.log('\n========== 测试完成 ==========');
  process.exit(0);
}

testInviteCode();
