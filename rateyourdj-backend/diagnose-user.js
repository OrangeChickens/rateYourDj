// ===================================================================
// diagnose-user.js - 诊断用户和邀请码状态
// ===================================================================

const { pool } = require('./src/config/database');

async function diagnose() {
  console.log('\n========== 诊断开始 ==========\n');

  try {
    // 1. 检查 REVIEWER2026 邀请码状态
    console.log('【1】邀请码状态');
    console.log('----------------------------------------');
    const [inviteCodes] = await pool.query(
      'SELECT * FROM invite_codes WHERE code = ?',
      ['REVIEWER2026']
    );

    if (inviteCodes.length === 0) {
      console.error('❌ 邀请码 REVIEWER2026 不存在！');
      return;
    }

    const invite = inviteCodes[0];
    console.log(`Code: ${invite.code}`);
    console.log(`Used Count: ${invite.used_count} / ${invite.usage_limit}`);
    console.log(`Is Active: ${invite.is_active}`);
    console.log(`Expires At: ${invite.expires_at}`);
    console.log(`Created By: ${invite.created_by || '(admin)'}`);

    // 2. 检查最近登录的用户（你）
    console.log('\n【2】最近创建/更新的用户（按时间倒序）');
    console.log('----------------------------------------');
    const [recentUsers] = await pool.query(`
      SELECT
        id,
        nickname,
        access_level,
        invite_code_used,
        created_at,
        updated_at
      FROM users
      ORDER BY updated_at DESC
      LIMIT 5
    `);

    recentUsers.forEach((user, index) => {
      console.log(`\n用户 #${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  昵称: ${user.nickname}`);
      console.log(`  访问级别: ${user.access_level}`);
      console.log(`  使用的邀请码: ${user.invite_code_used || '(无)'}`);
      console.log(`  创建时间: ${user.created_at}`);
      console.log(`  更新时间: ${user.updated_at}`);
    });

    // 3. 检查使用了 REVIEWER2026 的用户
    console.log('\n【3】使用了 REVIEWER2026 的用户');
    console.log('----------------------------------------');
    const [usersWithCode] = await pool.query(
      'SELECT * FROM users WHERE invite_code_used = ?',
      ['REVIEWER2026']
    );

    if (usersWithCode.length === 0) {
      console.log('❌ 没有用户使用过这个邀请码');
    } else {
      usersWithCode.forEach(user => {
        console.log(`  - 用户 ${user.id} (${user.nickname}) - access_level: ${user.access_level}`);
      });
    }

    // 4. 诊断结论
    console.log('\n【4】诊断结论');
    console.log('========================================');

    if (invite.used_count === 0 && usersWithCode.length === 0) {
      console.log('🔍 问题确认：邀请码从未被使用过');
      console.log('\n可能原因：');
      console.log('  1. 后端邀请码激活代码未执行（条件检查失败）');
      console.log('  2. InviteCode.use() 抛出异常被捕获');
      console.log('  3. 事务回滚了');
      console.log('\n请检查：');
      console.log('  → 后端控制台输出（查找"========== 邀请码激活检查 =========="）');
      console.log('  → 最近更新的用户（上面列表中的用户 #1）是否是你？');
      console.log('  → 该用户的 access_level 是什么？');
    } else if (invite.used_count > 0 && usersWithCode.length > 0) {
      console.log('✅ 邀请码已被正常使用');
      console.log(`   - Used Count: ${invite.used_count}`);
      console.log(`   - 使用用户数: ${usersWithCode.length}`);
    } else {
      console.log('⚠️ 数据不一致！');
      console.log(`   - Used Count: ${invite.used_count}`);
      console.log(`   - 实际使用用户数: ${usersWithCode.length}`);
    }

  } catch (error) {
    console.error('\n❌ 诊断失败:', error);
  } finally {
    await pool.end();
    console.log('\n========== 诊断结束 ==========\n');
  }
}

diagnose();
