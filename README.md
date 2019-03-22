# qnmanage

qiniu上传及删除文件工具

使用方式


```js
const QNManage = require('QNManage');
const instance = new QNManage({
    ak:'',
    sk:'',
    bucket:''
})


instance.deleteFile(function(){
    instance.ergodicFile(`path`)
});

```


