# qnmanage

qiniu上传及删除文件工具

使用方式


```js
const QNManage = require('QNManage');
const instance = new QNManage({
    ak:'',
    sk:'',
    bucket:'',//bucket
    zone:'',//上传区域
    dir:'',// 需要上传目录
    rewrite:'',// 替换dir
})


//先删除再上传
instance.deleteFile(function(){
    instance.ergodicFile()
});


//直接上传
instance.ergodicFile()
```


