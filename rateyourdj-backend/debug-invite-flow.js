// ===================================================================
// debug-invite-flow.js - 邀请码完整流程调试工具
// ===================================================================

const { pool } = require('./src/config/database');
const InviteCode = require('./src/models/InviteCode');
const User = require('./src/models/User');

async function debugInviteFlow() {
  console.log('\n========================================');
  console.log('邀请码完整流程调试');
  console.log('========================================\n');

  const testCode = 'REVIEWER2026';

  try {
    // 1. 检查邀请码当前状态
    console.log('【步骤 1】检查邀请码当前状态');
    console.log('----------------------------------------');
    const [inviteRows] = await pool.query(
      'SELECT * FROM invite_codes WHERE code = ?',
      [testCode]
    );

    if (inviteRows.length === 0) {
      console.error('❌ 邀请码不存在！');
      return;
    }

    const invite = inviteRows[0];
    console.log(`✅ 邀请码存在`);
    console.log(`   - Code: ${invite.code}`);
    console.log(`   - Used Count: ${invite.used_count}`);
    console.log(`   - Usage Limit: ${invite.usage_limit}`);
    console.log(`   - Is Active: ${invite.is_active}`);
    console.log(`   - Expires At: ${invite.expires_at}`);
    console.log(`   - Creator Type: ${invite.creator_type}`);
    console.log(`   - Created By: ${invite.created_by || '(无)'}`);

    // 2. 测试验证功能（不应该增加 used_count）
    console.log('\n【步骤 2】测试验证功能（validate）');
    console.log('----------------------------------------');
    const validation = await InviteCode.validate(testCode);
    console.log(`   验证结果: ${validation.valid ? '✅ 有效' : '❌ 无效'}`);
    if (!validation.valid) {
      console.log(`   失败原因: ${validation.message}`);
    }

    // 再次检查 used_count（应该仍然是原值）
    const [inviteAfterValidate] = await pool.query(
      'SELECT used_count FROM invite_codes WHERE code = ?',
      [testCode]
    );
    console.log(`   Used Count (验证后): ${inviteAfterValidate[0].used_count}`);
    console.log(`   ${inviteAfterValidate[0].used_count === invite.used_count ? '✅ 正确，验证不改变 used_count' : '❌ 错误，used_count 被修改了'}`);

    // 3. 查找一个测试用户
    console.log('\n【步骤 3】查找测试用户');
    console.log('----------------------------------------');
    const [users] = await pool.query(
      'SELECT * FROM users WHERE access_level = "waitlist" LIMIT 1'
    );

    if (users.length === 0) {
      console.warn('⚠️ 没有找到 waitlist 用户，跳过使用测试');
      return;
    }

    const testUser = users[0];
    console.log(`✅ 找到测试用户`);
    console.log(`   - User ID: ${testUser.id}`);
    console.log(`   - Nickname: ${testUser.nickname}`);
    console.log(`   - Access Level: ${testUser.access_level}`);
    console.log(`   - Invite Code Used: ${testUser.invite_code_used || '(无)'}`);

    // 检查用户是否已经使用过邀请码
    if (testUser.invite_code_used) {
      console.warn(`⚠️ 该用户已使用过邀请码: ${testUser.invite_code_used}`);
      console.warn('⚠️ 跳过使用测试（一个用户只能使用一次邀请码）');
      return;
    }

    // 4. 模拟登录时使用邀请码
    console.log('\n【步骤 4】模拟使用邀请码（InviteCode.use）');
    console.log('----------------------------------------');
    console.log(`   准备调用: InviteCode.use('${testCode}', ${testUser.id})`);

    // 询问是否继续
    console.log('\n⚠️  警告：下一步将真实调用 InviteCode.use()，会修改数据库！');
    console.log('   - 邀请码 used_count 将 +1');
    console.log('   - 用户将升级为 full access');
    console.log('\n如果要继续，请修改此脚本，取消第 111 行的注释\n');

    // 取消下面的注释来真实执行（危险操作！）
    // const result = await InviteCode.use(testCode, testUser.id);
    //
    // console.log('✅ 使用成功！');
    // console.log(`   - Invited By: ${result.invitedBy || '(无)'}`);
    //
    // // 5. 验证结果
    // console.log('\n【步骤 5】验证使用结果');
    // console.log('----------------------------------------');
    //
    // // 检查邀请码 used_count
    // const [inviteAfterUse] = await pool.query(
    //   'SELECT used_count FROM invite_codes WHERE code = ?',
    //   [testCode]
    // );
    // console.log(`   邀请码 Used Count: ${invite.used_count} → ${inviteAfterUse[0].used_count}`);
    // console.log(`   ${inviteAfterUse[0].used_count === invite.used_count + 1 ? '✅ 正确，used_count +1' : '❌ 错误，used_count 没有增加'}`);
    //
    // // 检查用户状态
    // const updatedUser = await User.findById(testUser.id);
    // console.log(`   用户 Access Level: ${testUser.access_level} → ${updatedUser.access_level}`);
    // console.log(`   用户 Invite Code Used: (无) → ${updatedUser.invite_code_used}`);
    // console.log(`   ${updatedUser.access_level === 'full' ? '✅ 正确，用户已升级为 full access' : '❌ 错误，用户未升级'}`);

  } catch (error) {
    console.error('\n❌ 调试过程出错:', error.message);
    console.error('   错误堆栈:\n', error.stack);
  } finally {
    await pool.end();
    console.log('\n========================================');
    console.log('调试结束');
    console.log('========================================\n');
  }
}

// 执行调试
debugInviteFlow();
