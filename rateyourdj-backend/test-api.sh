#!/bin/bash

# 测试 Waitlist 和任务系统 API
# 使用方式：bash test-api.sh

BASE_URL="http://localhost:3000/api"

echo "========================================="
echo "测试 Waitlist 和任务系统 API"
echo "========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 获取一个有效的 token（使用现有用户 ID 1）
echo -e "${YELLOW}步骤 1: 模拟登录获取 token${NC}"
# 注意：这里我们直接用现有用户 ID 1，实际应该通过微信登录获取
# 为了测试，我们需要一个真实的 token
echo "提示：需要真实的微信登录 token，暂时跳过..."
echo ""

# 使用一个测试 token（需要替换为真实的）
# TOKEN="your-real-token-here"

echo -e "${YELLOW}步骤 2: 测试邀请码验证${NC}"
curl -s -X POST "$BASE_URL/invite/validate" \
  -H "Content-Type: application/json" \
  -d '{"code": "UDISK-TEST01"}' | jq '.'
echo ""

echo -e "${YELLOW}步骤 3: 查看任务配置（直接查询数据库）${NC}"
docker exec -i rateyourdj-mysql mysql -uroot -prateyourdj123 rateyourdj -e "
  SELECT task_code, task_name, task_category, target, reward_invites, repeatable, max_repeats
  FROM task_configs
  WHERE is_active = TRUE
  ORDER BY task_category, sort_order;
" 2>/dev/null
echo ""

echo -e "${YELLOW}步骤 4: 查看生成的邀请码${NC}"
docker exec -i rateyourdj-mysql mysql -uroot -prateyourdj123 rateyourdj -e "
  SELECT code, creator_type, usage_limit, used_count, is_active
  FROM invite_codes
  ORDER BY created_at DESC
  LIMIT 5;
" 2>/dev/null
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}数据库迁移测试完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "可用的测试邀请码："
echo "  - UDISK-UNLIMITED (无限使用)"
echo "  - UDISK-DEV (无限使用)"
echo "  - UDISK-TEST01 ~ UDISK-TEST05 (单次使用)"
echo "  - UDISK-BETA01 ~ UDISK-BETA05 (单次使用)"
echo ""
echo "下一步："
echo "  1. 在微信开发者工具中登录获取真实 token"
echo "  2. 使用 token 测试完整的 API 流程"
echo "  3. 测试邀请码使用和任务系统"
