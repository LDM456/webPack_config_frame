# frame_demo

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

项目依赖中通常会引用大量的 npm 包，而这些包在正常的开发过程中并不会进行修改,在打包前先运行下边这条命令，将npm包预先编译，减少打包时间
npm run build:dll

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
## **优化配置webpack：**

#### 1.配置resolve.modules

​		resolve.modules 是用来配置模块库（即 node_modules）所在的位置。当 js 里出现 import 'vue' 这样不是对、也不是绝对路径的写法时，它便会到 node_modules 目录下去找，为了减少搜索范围，可我们以直接写明 node_modules 的全路径
​		build/webpack.base.conf.js 文件，如下配置modules

​		

```js
 resolve: {
    extensions: ['.js', '.vue', '.json'],
    modules: [
      resolve('src'),
      resolve('node_modules')
    ],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
    }
  },
```



#### 2.配置装载机(loaders) 的include & exclude

​		装载机（**loaders**）里的每个子项都可以有 **include** 和 **exclude** 属性:

​			·	**include**：导入的文件将由加载程序转换的路径或文件数组（把要处理的目录包括进来）

​			·	**exclude**：不能满足的条件（排除不处理的目录）

​		所以，使用include更精确的指定要处理的目录，减少不必要的遍历，减少性能损耗；同时使用exclude予以排除。

​		 **build/webpack.base.conf.js** 文件module对象下的reles，如下高亮配置：

​		

```
	{
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig,
        include: [resolve('src'), resolve('node_modules/vue-easytable/libs')],
        exclude: /node_modules\/(?!(autotrack|dom-utils))|vendor\.dll\.js/
      },
      {
        // js 文件才使用 babel
        test: /\.js$/,
        use: ['babel-loader'],
        // 只处理src文件夹下面的文件
        include: path.resolve('src'),
        // 不处理node_modules下面的文件
        exclude: /node_modules/
      },
```





#### 3.使用webpack-parallel-uglify-plugin插件压缩代码

​		默认webpack使用UglifyJS来压缩代码，但是其采用的是单线程压缩，速度较慢，webpack-parallel-uglify-plugin插件能能够并行运行UglifyJS插件，大大减少构建时间

​		优先执行如下命令安装 **webpack-parallel-uglify-plugin**

```js
   npm i webpack-parallel-uglify-plugin
```

**	build/webpack.prod.conf.js** 文件下的plugins下，并作如下修改

​		

```
// 删掉webpack提供的UglifyJS插件
    // new UglifyJsPlugin({
    //   uglifyOptions: {
    //     compress: {
    //       warnings: false
    //     }
    //   },
    //   sourceMap: config.build.productionSourceMap,
    //   parallel: true
    // }),
    // 增加 webpack-parallel-uglify-plugin来替换
    new ParallelUglifyPlugin({
      cacheDir: '.cache/',
      uglifyJS:{
        output: {
          comments: false
        },
          warnings: false
        // compress: {
        //   warnings: false
        // }
      }
    }),
```



#### 4.使用Happypack来加速代码打包速度

​		由于webpack是基于node运行的单线程模型,所以happypack的原理是将原有的loader的执行过程扩展成为多线程模型进行代码构建.

​		优先执行如下命令安装 **happypack**

```
	npm i happypack
```

 **build/webpack.base.conf.js** 文件下，作如下修改

​		

```
//首先引入
// 配置happypack
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

//在plugins中添加
plugins: [
    new HappyPack({
      //用id来标识 happypack处理那里类文件
      id: 'happyBabel',
      //如何处理  用法和loader 的配置一样
      loaders: [{
        loader: 'babel-loader?cacheDirectory=true',
      }],
      //共享进程池
      threadPool: happyThreadPool,
      //允许 HappyPack 输出日志
      verbose: true,
    }),
  ],
```



#### 5.利用 DllPlugin 和 DllReferencePlugin 预编译资源模块

​		依赖中通常会引用大量的 **npm** 包，而这些包在正常的开发过程中并不会进行修改，但是在每一次构建过程中却需要反复的将其解析，为避免此类损耗,使用这两个插件进行优化

​		**DllPlugin** 插件：作用是预先编译一些模块

​		**DllReferencePlugin** 插件：它的所用则是把这些预先编译好的模块引用起来。

​	注意：**DllPlugin** 必须要在 **DllReferencePlugin** 执行前先执行一次，**dll** 这个概念应该也是借鉴了 **windows** 程序开发中的 **dll** 文件的设计理念

#### 		过程:

###### 		1、**build** 文件夹中新建 **webpack.dll.conf.js** 文件，内容如下（主要是配置下需要提前编译打包的库）

​		

```
const path = require('path');
const webpack = require('webpack');
 
module.exports = {
  entry: {
    vendor: [ //自定义，将哪些插件预编译根据需求而定
            'vue-router',
            'axios',
            'vuex',
            ]
  },
  output: {
    path: path.join(__dirname, '../static/js'),
    filename: '[name].dll.js',
    library: '[name]_library'       // vendor.dll.js中暴露出的全局变量名
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.join(__dirname, '.', '[name]-manifest.json'),
      name: '[name]_library'
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
```



###### 	2、编辑 **package.json** 文件，添加一条编译命令

​			

```
"scripts": {
    "build:dll": "webpack --config build/webpack.dll.conf.js"
  },
```



###### 	3、接着执行 **npm run build:dll** 命令来生成 **vendor.dll.js**

​		查看static文件下的js

###### 	4、**index.html** 这边将 **vendor.dll.js** 引入进来

​		

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>frame_demo</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- built files will be auto injected -->
    <script src="./static/js/vendor.dll.js"></script>
  </body>
</html>
```



###### 	5、 **build/webpack.base.conf.js** 文件，编辑添加如下高亮配置，作用是通过 **DLLReferencePlugin** 来使用 **DllPlugin** 生成的 **DLL Bundle**，在happyhack后继续添加DllReferencePlugin插件

```
plugins: [
    new HappyPack({
      //用id来标识 happypack处理那里类文件
      id: 'happyBabel',
      //如何处理  用法和loader 的配置一样
      loaders: [{
        loader: 'babel-loader?cacheDirectory=true',
      }],
      //共享进程池
      threadPool: happyThreadPool,
      //允许 HappyPack 输出日志
      verbose: true,
    }),
    // 添加DllReferencePlugin插件
    new webpack.DllReferencePlugin({
      context: path.resolve(__dirname, '..'),
      manifest: require('./vendor-manifest.json')
    }),
  ],
```

