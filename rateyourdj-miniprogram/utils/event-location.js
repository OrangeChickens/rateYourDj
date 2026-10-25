function coordinates(value) {
  const lat=value.latitude, lng=value.longitude;
  if (lat===null || lng===null || lat===undefined || lng===undefined || lat==='' || lng==='') return null;
  const latitude=Number(lat),longitude=Number(lng);
  return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180 ? {latitude,longitude} : null;
}
function selected(value) {
  const point=coordinates(value);
  if (!point || !value.name || !value.address) throw new Error('场地信息不完整，请重新选择或手动填写');
  return {venue:value.name,address:value.address,...point};
}
module.exports={coordinates,selected};
