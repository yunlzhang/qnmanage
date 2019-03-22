const qiniu = require('qiniu');
const fs = require('fs');

class QNManage {
    constructor(options){
        this.options = options;
        const {ak = '',sk = '',bucket = '',path = '',zone = 'Zone_z0'} = options;
        if(!ak || !sk || !bucket){
            throw new Error('ak,sk,bucket can\'t be vacant!');
        }
        this.mac = new qiniu.auth.digest.Mac(ak, sk);
        this.config = new qiniu.conf.Config();
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    generateToken() {
        const {bucket} = this.options;
        const options = {
            scope: bucket
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        return putPolicy.uploadToken(this.mac);
    }

    uploadFile(file){
        const {zone} = this.options;
        const uploadToken = this.generateToken();
        this.config.zone = qiniu.zone[zone];
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();
        const readableStream = fs.createReadStream(file);
        formUploader.putStream(uploadToken, file, readableStream, putExtra, (err, res) => {
            if(err) throw new Error(err);
            fs.appendFile('./hash.txt', JSON.stringify(res) + '\r\n', err => {
                if(err) throw new Error(err);
            })
        });
        
    }

    ergodicFile(path){
        fs.readdir(path, (err,files) => {
            if(err) throw new Error(err);
            files.forEach(item => {
                fs.stat(`${path}/${item}`,(err, stats) => {
                    if(err) throw new Error(err);
                    if (stats.isFile()) {
                        this.uploadFile(`${path}/${item}`);
                    } else {
                        this.ergodicFile(`${path}/${item}`)
                    }
                })
            })
        });
    }

    deleteFile(callback){
        const {bucket} = this.options;
        const hashData = fs.readFileSync('./hash.txt', 'utf8')
        try {
            const tempArr = hashData.split('\r\n');
            const keyArr = tempArr.map((item, index) => {
                return JSON.parse(item || '{}');
            }).filter(item => {
                return item && item.key;
            })
            const deleteOperations = [];
            keyArr.forEach(item => {
                deleteOperations.push(qiniu.rs.deleteOp(bucket, item.key))
            });
            this.bucketManager.batch(deleteOperations, (err, respBody, respInfo) => {
                if(err) throw new Error(err);
                console.log('文件删除成功');
                fs.unlinkSync('./hash.txt');
                callback && callback();
            });
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = QNManage;