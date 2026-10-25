function coordinates(value) {
  const lat=value.latitude, lng=value.longitude;
  if (lat===null || lng===null || lat===undefined || lng===undefined || lat==='' || lng==='') return null;
  const latitude=Number(lat),longitude=Number(lng);
  return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180 ? {latitude,longitude} : null;
}
function cityFromAddress(address) {
  if (typeof address !== 'string') return '';
  const normalized = address.trim().replace(/^中国[，,\s]*/, '');
  const municipality = /^(北京市|上海市|天津市|重庆市)/.exec(normalized);
  if (municipality) return municipality[1];
  const rest = normalized.replace(/^(?:内蒙古自治区|广西壮族自治区|西藏自治区|宁夏回族自治区|新疆维吾尔自治区|[\u4e00-\u9fff]{2,3}省)/, '');
  const city = /^([\u4e00-\u9fff]{2,16}?(?:自治州|地区|市|盟))/.exec(rest);
  return city && !/[区县]/.test(city[1].replace(/(?:自治州|地区|市|盟)$/, '')) ? city[1] : '';
}
function selected(value) {
  const point=coordinates(value);
  if (!point || !value.name || !value.address) throw new Error('场地信息不完整，请重新选择或手动填写');
  return {venue:value.name,address:value.address,...point};
}
module.exports={coordinates,selected,cityFromAddress};
