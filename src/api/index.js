import axios from "axios";
import store from "../store";
import router from "../router";

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_URL, // api 的 VUE_APP_URL
  timeout: 50000 // 请求超时时间(因为需要调试后台,所以设置得比较大)
});
// 环境的切换
  axios.defaults.baseURL = process.env.VUE_APP_URL;

// request拦截器,在请求之前做一些处理
service.interceptors.request.use(
  config => {
    if (store.state.token) {
      // 给请求头添加laohu-token
      config.headers["user-token"] = store.state.token;
    }
    return config;
  },
  error => {
    console.log(error); // for debug
    Promise.reject(error);
  }
);

// response 拦截器,数据返回后进行一些处理
service.interceptors.response.use(
  response => {
    /**
     * code为非20000是抛错 可结合自己业务进行修改
     */
    const res = response.data;
    return res;
    // if (res.code == "200") {
    //  
    // } else if (res.code == "603") {
    //   // code为603代表token已经失效,
    //   // 提示用户,然后跳转到登陆页面
    //   router.push("/login");
    // } else { 
    //   //Promise.reject(res.message);
    //   return res.message;
    // }
  },
  error => {
    Promise.reject("网络异常!");
    // router.push("/login");
  }
);
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params: params
    }).then(res => {
      resolve(res.data);
    }).catch(err => {
      reject(err.data)
    })
  });
}
/** 
* post方法，对应post请求 
* @param {String} url [请求的url地址] 
* @param {Object} params [请求时携带的参数] 
*/
export function post(url, params) {
  return new Promise((resolve, reject) => {
    axios.post(url, JSON.stringify(params))
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err.data)
      })
  });
}
export default service;
