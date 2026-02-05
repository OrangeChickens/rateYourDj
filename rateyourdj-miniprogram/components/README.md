# 组件说明

本目录包含可复用的微信小程序组件。

---

## ✅ 已实现组件

### rating-stars - 评分星星组件

显示或输入评分星星的组件。

#### 使用方法

1. **在页面json中引入组件**
```json
{
  "usingComponents": {
    "rating-stars": "/components/rating-stars/rating-stars"
  }
}
```

2. **在wxml中使用**
```xml
<!-- 只读显示模式 -->
<rating-stars rating="{{4.5}}" size="medium" />

<!-- 交互输入模式 -->
<rating-stars
  rating="{{userRating}}"
  size="large"
  interactive="{{true}}"
  bind:change="onRatingChange"
/>
```

3. **在js中处理事件**
```javascript
onRatingChange(e) {
  const rating = e.detail.rating;
  this.setData({ userRating: rating });
}
```

#### 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| rating | Number | 0 | 评分值（0-5） |
| size | String | 'medium' | 星星大小：small/medium/large |
| interactive | Boolean | false | 是否可交互点击 |

#### 事件说明

| 事件名 | 说明 | 参数 |
|--------|------|------|
| change | 评分变化时触发（仅interactive模式） | e.detail = { rating: Number } |

---

## 📋 待实现组件

以下组件目录已创建但尚未实现，可根据需要开发：

### dj-card - DJ卡片组件

用于展示DJ信息的卡片组件。

**建议属性**：
- dj: Object - DJ信息对象
- showActions: Boolean - 是否显示操作按钮

**建议实现**：
- 从首页提取DJ卡片UI代码
- 支持不同布局模式（横向/纵向）
- 包含收藏按钮

---

### review-card - 评论卡片组件

用于展示评论的卡片组件。

**建议属性**：
- review: Object - 评论信息对象
- showActions: Boolean - 是否显示操作按钮

**建议实现**：
- 显示用户头像、昵称、评分
- 显示评论内容、标签
- 点赞和举报按钮

---

### tag-selector - 标签选择器组件

用于选择标签的组件。

**建议属性**：
- tags: Array - 可选标签列表
- selectedTags: Array - 已选标签
- maxTags: Number - 最多可选数量

**建议实现**：
- 标签分类显示
- 多选/单选模式
- 选中状态显示

---

## 🔧 创建新组件

### 1. 创建组件目录和文件

```bash
# 在components目录下创建新组件
cd components/
mkdir my-component
cd my-component

# 创建组件的4个文件
touch my-component.js
touch my-component.wxml
touch my-component.json
touch my-component.wxss
```

### 2. 组件基本结构

**my-component.js**
```javascript
Component({
  properties: {
    // 组件属性
  },
  data: {
    // 组件数据
  },
  methods: {
    // 组件方法
  }
});
```

**my-component.json**
```json
{
  "component": true,
  "usingComponents": {}
}
```

### 3. 在页面中使用

在页面的json文件中引入：
```json
{
  "usingComponents": {
    "my-component": "/components/my-component/my-component"
  }
}
```

在页面的wxml中使用：
```xml
<my-component prop="value" bind:event="handler" />
```

---

## 📚 组件开发最佳实践

### 1. 命名规范
- 组件名使用小写加连字符：`my-component`
- 文件名与组件名一致
- 事件名使用驼峰命名：`onChange`

### 2. 属性设计
- 提供合理的默认值
- 使用明确的类型声明
- 添加属性验证

### 3. 样式隔离
- 使用 `styleIsolation: 'isolated'` 确保样式不冲突
- 避免使用全局选择器
- 使用BEM命名规范

### 4. 事件通信
- 使用 `triggerEvent` 触发自定义事件
- 事件名使用驼峰命名
- 传递必要的数据

### 5. 性能优化
- 避免频繁的 `setData`
- 使用 `observers` 监听属性变化
- 合理使用生命周期函数

---

## 🎯 组件开发优先级

根据功能需求，建议按以下顺序开发组件：

1. ✅ **rating-stars** - 已完成（评分星星）
2. **dj-card** - 高优先级（多处使用）
3. **review-card** - 高优先级（详情页使用）
4. **tag-selector** - 中优先级（评论页使用）

---

## 📝 示例：使用rating-stars组件

### 场景1：只读显示评分

```xml
<view class="rating-display">
  <text>综合评分：</text>
  <rating-stars rating="{{dj.overall_rating}}" />
  <text>{{dj.overall_rating}}</text>
</view>
```

### 场景2：用户评分输入

```xml
<view class="rating-input">
  <text>给DJ打分：</text>
  <rating-stars
    rating="{{myRating}}"
    size="large"
    interactive="{{true}}"
    bind:change="handleRatingChange"
  />
</view>
```

```javascript
Page({
  data: {
    myRating: 0
  },
  handleRatingChange(e) {
    this.setData({
      myRating: e.detail.rating
    });
    console.log('用户评分：', e.detail.rating);
  }
});
```

---

## 🔗 相关资源

- [微信小程序组件开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/)
- [组件模板和样式](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)
- [组件通信与事件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html)
