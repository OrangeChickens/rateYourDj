import { reviewAPI, commentAPI } from '../../utils/api';
import { formatDate } from '../../utils/util';
Component({
  properties:{review:{type:Object,value:null}},
  data:{item:null,voting:false,expanded:false,comments:[],commentsLoading:false,commentsError:'',commentPage:1,commentsMore:false,sending:false,commentVoting:false,feedback:''},
  observers:{review(value) {if(value)this.setData({item:{...value,stars:'★'.repeat(Math.max(0,Math.min(5,Number(value.overall_rating)||0))),dateLabel:formatDate(value.created_at)}});}},
  lifetimes:{detached(){this._commentsRequest=(this._commentsRequest||0)+1;}},
  methods:{
    loggedIn(){if(getApp().globalData.token)return true;wx.showToast({title:'请先登录后互动',icon:'none'});return false;},
    viewDJ(){wx.navigateTo({url:`/pages/dj-detail/dj-detail?id=${this.data.item.dj_id}`});},
    viewDetail(){wx.navigateTo({url:`/pages/review-detail/review-detail?id=${this.data.item.id}`});},
    prepareShare(){this.triggerEvent('share',{id:this.data.item.id});},
    async vote(e){
      if(this.data.voting||!this.loggedIn())return;
      const type=e.currentTarget.dataset.type;if(!['helpful','not_helpful'].includes(type))return;
      const item=this.data.item;this.setData({voting:true});
      try {
        await (type==='helpful'?reviewAPI.markHelpful(item.id):reviewAPI.markNotHelpful(item.id));
        let helpful=Number(item.helpful_count)||0,notHelpful=Number(item.not_helpful_count)||0;
        if(item.user_vote==='helpful')helpful=Math.max(0,helpful-1);
        if(item.user_vote==='not_helpful')notHelpful=Math.max(0,notHelpful-1);
        const vote=item.user_vote===type?null:type;
        if(vote==='helpful')helpful++;if(vote==='not_helpful')notHelpful++;
        const next={...item,user_vote:vote,helpful_count:helpful,not_helpful_count:notHelpful};
        this.setData({item:next});this.triggerEvent('update',{id:item.id,user_vote:vote,helpful_count:helpful,not_helpful_count:notHelpful});
      } catch(error){wx.showToast({title:error.message||'操作失败，请重试',icon:'none'});}
      finally{this.setData({voting:false});}
    },
    toggleComments(){this.setData({expanded:!this.data.expanded});if(this.data.expanded)this.loadComments();},
    formatComments(rows){const userId=getApp().globalData.userInfo?.id;return rows.map(row=>({...row,timeAgo:formatDate(row.created_at),canDelete:!!userId&&Number(row.user_id)===Number(userId),replies:this.formatComments(row.replies||[])}));},
    async loadComments(append=false){
      if(append&&(this.data.commentsLoading||!this.data.commentsMore||this.data.commentsError))return;
      const request=this._commentsRequest=(this._commentsRequest||0)+1,page=append?this.data.commentPage+1:1;
      this.setData({commentsLoading:true,commentsError:''});
      try{const res=await commentAPI.getList(this.data.item.id,page,20);if(request!==this._commentsRequest)return;this.setData({comments:append?[...this.data.comments,...this.formatComments(res.data)]:this.formatComments(res.data),commentPage:page,commentsMore:page<res.pagination.totalPages});}
      catch(error){if(request===this._commentsRequest)this.setData({commentsError:error.message||'评论加载失败'});}
      finally{if(request===this._commentsRequest)this.setData({commentsLoading:false});}
    },
    retryComments(){this.loadComments();},moreComments(){this.loadComments(true);},
    writeComment(){return this.compose(null,'评论评价');},
    reply(e){return this.compose(e.detail.commentId,`回复 ${e.detail.nickname||'评论'}`);},
    async compose(parent,title){
      if(this.data.sending||!this.loggedIn())return;
      this.setData({sending:true});
      try{
        const answer=await new Promise(resolve=>wx.showModal({title,editable:true,placeholderText:'写下你的评论（最多500字）',success:resolve,fail:()=>resolve({confirm:false})}));
        if(!answer.confirm)return;const content=(answer.content||'').trim();
        if(!content){wx.showToast({title:'请输入评论内容',icon:'none'});return;}
        if(content.length>500){wx.showToast({title:'评论最多500字',icon:'none'});return;}
        const res=await commentAPI.create(this.data.item.id,content,parent);
        const approved=res.data?.status==='approved';
        const feedback=approved?'评论已发布':res.data?.moderation_reason||res.moderation_reason||res.message||'评论已提交审核，通过后公开展示';
        this.setData({feedback,expanded:true});
        if(approved){const count=(Number(this.data.item.comment_count)||0)+1;this.setData({item:{...this.data.item,comment_count:count}});this.triggerEvent('update',{id:this.data.item.id,comment_count:count});}
        else wx.showModal({title:'评论审核反馈',content:feedback,showCancel:false});
        await this.loadComments();
      }catch(error){wx.showToast({title:error.message||'评论未发送，请重试',icon:'none'});}
      finally{this.setData({sending:false});}
    },
    async commentVote(e,type){if(this.data.commentVoting||!this.loggedIn())return;this.setData({commentVoting:true});try{await commentAPI.vote(e.detail.commentId,type);await this.loadComments();}catch(error){wx.showToast({title:error.message||'操作失败',icon:'none'});}finally{this.setData({commentVoting:false});}},
    upvote(e){this.commentVote(e,'upvote');},downvote(e){this.commentVote(e,'downvote');},
    async deleteComment(e){if(!this.loggedIn())return;const result=await new Promise(resolve=>wx.showModal({title:'删除评论',content:'确定删除这条评论？',success:resolve,fail:()=>resolve({confirm:false})}));if(!result.confirm)return;try{await commentAPI.delete(e.detail.commentId);const size=rows=>rows.reduce((sum,row)=>sum+1+size(row.replies||[]),0);const removed=rows=>{for(const row of rows){if(Number(row.id)===Number(e.detail.commentId))return 1+size(row.replies||[]);const n=removed(row.replies||[]);if(n)return n;}return 0;};const count=Math.max(0,(Number(this.data.item.comment_count)||0)-(removed(this.data.comments)||1));this.setData({item:{...this.data.item,comment_count:count}});this.triggerEvent('update',{id:this.data.item.id,comment_count:count});await this.loadComments();}catch(error){wx.showToast({title:error.message||'删除失败',icon:'none'});}}
  }
});
