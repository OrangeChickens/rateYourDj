Component({
  properties: {
    stats: {
      type: Object,
      value: {
        djCount: 0,
        reviewCount: 0,
        interactionCount: 0,
        userCount: 0
      }
    },
    texts: {
      type: Object,
      value: {
        title: '平台数据',
        djTotal: 'DJ总数',
        reviewTotal: '评价总数',
        interactionTotal: '互动总数',
        userTotal: '用户总数'
      }
    }
  }
});
