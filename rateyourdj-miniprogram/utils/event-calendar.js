const {coordinates}=require('./event-location');
const day=86400000;
function today() {return new Date(Date.now()+8*3600000).toISOString().slice(0,10);}
function add(date,n) {return new Date(Date.parse(date+'T00:00:00Z')+n*day).toISOString().slice(0,10);}
function weekend(date) {
  const weekday=new Date(date+'T00:00:00Z').getUTCDay();
  const saturday=add(date,weekday===0?-1:(6-weekday));
  return {from:weekday===0?date:saturday,to:add(saturday,1)};
}
function days(date) {return Array.from({length:7},(_,i)=>{const value=add(date,i);return {value,label:value.slice(5),weekday:['日','一','二','三','四','五','六'][new Date(value+'T00:00:00Z').getUTCDay()]};});}
function markers(rows) {
  const groups=[];
  for(const row of rows) {
    const point=coordinates(row);if(!point) continue;
    let group=groups.find(item=>item.latitude===point.latitude&&item.longitude===point.longitude);
    if(!group) {group={...point,id:groups.length+1,venue:row.venue,eventIds:[],width:28,height:36,iconPath:'/images/event-pin.png'};groups.push(group);}
    group.eventIds.push(row.id);
    group.callout={content:group.venue+(group.eventIds.length>1?' · '+group.eventIds.length+'场':''),display:'ALWAYS',color:'#000000',bgColor:'#FFFFFF',padding:8,borderWidth:1,borderColor:'#000000',borderRadius:0,fontSize:12};
  }
  return groups;
}
function decorate(row) {return {...row,dateLabel:row.starts_at.slice(0,10),timeLabel:row.starts_at.slice(11,16),lineupLabel:(row.djs || []).map(dj=>dj.name).join(' / ')};}
module.exports={today,add,weekend,days,markers,decorate};
