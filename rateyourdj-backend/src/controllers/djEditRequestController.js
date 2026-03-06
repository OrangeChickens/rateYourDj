const DJEditRequest = require('../models/DJEditRequest');
const DJ = require('../models/DJ');

// 创建修改申请
async function createEditRequest(req, res, next) {
  try {
    const { dj_id, proposed_data } = req.body;

    if (!dj_id || !proposed_data) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：dj_id 和 proposed_data'
      });
    }

    // 检查DJ是否存在
    const dj = await DJ.findById(dj_id);
    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ不存在'
      });
    }

    // 检查是否已有pending申请
    const hasPending = await DJEditRequest.hasPending(dj_id, req.user.userId);
    if (hasPending) {
      return res.status(400).json({
        success: false,
        message: '你已有一个待审核的修改申请，请等待处理'
      });
    }

    const id = await DJEditRequest.create(dj_id, req.user.userId, proposed_data);

    res.status(201).json({
      success: true,
      message: '修改申请已提交，等待管理员审核',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
}

// 获取待审核列表
async function getPendingList(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await DJEditRequest.getPending(page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

// 获取待审核数量
async function getPendingCount(req, res, next) {
  try {
    const count = await DJEditRequest.getPendingCount();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
}

// 获取申请详情
async function getDetail(req, res, next) {
  try {
    const { id } = req.params;
    const detail = await DJEditRequest.getDetail(id);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: '申请不存在'
      });
    }

    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    next(error);
  }
}

// 审核通过
async function approveRequest(req, res, next) {
  try {
    const { id } = req.params;
    await DJEditRequest.approve(id);

    res.json({
      success: true,
      message: '已通过，DJ资料已更新'
    });
  } catch (error) {
    if (error.message === '申请不存在或已处理') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

// 拒绝
async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params;
    const success = await DJEditRequest.reject(id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: '申请不存在或已处理'
      });
    }

    res.json({
      success: true,
      message: '已拒绝'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEditRequest,
  getPendingList,
  getPendingCount,
  getDetail,
  approveRequest,
  rejectRequest
};
