const request = (url, method = 'GET', data = {}, needAuth = true) => getApp().request({ url: `/dj-content${url}`, method, data, needAuth });
module.exports = {
  list: (djId, type, params = {}) => request(`/${djId}/${type}`, 'GET', params, false),
  create: (djId, type, data) => request(`/${djId}/${type}`, 'POST', data),
  mine: (djId, type, page = 1) => request(`/mine/${type}`, 'GET', { djId, page }),
  adminList: (type, status, page = 1) => request(`/admin/${type}`, 'GET', { status, page }),
  detail: (type, id) => request(`/entry/${type}/${id}`),
  update: (type, id, data) => request(`/entry/${type}/${id}`, 'PUT', data),
  moderate: (type, id, data) => request(`/entry/${type}/${id}/status`, 'PUT', data),
  merge: id => request(`/duplicates/${id}/merge`, 'POST'),
  codeURL: (djId, env) => `${getApp().globalData.apiBaseUrl}/dj-content/${djId}/share-code?env=${env}`
};
