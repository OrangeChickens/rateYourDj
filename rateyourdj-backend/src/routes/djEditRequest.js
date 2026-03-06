const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createEditRequest,
  getPendingList,
  getPendingCount,
  getDetail,
  approveRequest,
  rejectRequest
} = require('../controllers/djEditRequestController');

// 用户提交修改申请
router.post('/create', authenticate, createEditRequest);

// 管理员：获取待审核列表
router.get('/pending/list', requireAdmin, getPendingList);

// 管理员：获取待审核数量
router.get('/pending/count', requireAdmin, getPendingCount);

// 管理员：获取申请详情
router.get('/:id', requireAdmin, getDetail);

// 管理员：审核通过
router.put('/:id/approve', requireAdmin, approveRequest);

// 管理员：拒绝
router.put('/:id/reject', requireAdmin, rejectRequest);

module.exports = router;
