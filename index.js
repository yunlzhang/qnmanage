const qiniu = require('qiniu');
const fs = require('fs');

class QNManage {
    constructor(options){
        this.options = Object.assign({},{
            zone:'Zone_z0',
            dir:'dist'
        },options);
        const {dir,ak,sk,bucket} = options;
        if(!ak || !sk || !bucket || !dir){
            throw new Error('ak,sk,bucket,dir can\'t be vacant!');
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
        const {dir,rewrite} = this.options;
        const {zone} = this.options;
        const uploadToken = this.generateToken();
        this.config.zone = qiniu.zone[zone];
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();
        const readableStream = fs.createReadStream(file);
        let name = file;
        if(rewrite){
            name = file.replace(dir,rewrite);
        }
        formUploader.putStream(uploadToken, name, readableStream, putExtra, (err, res) => {
            if(err) throw new Error(err);
            fs.appendFile('./hash.txt', JSON.stringify(res) + '\r\n', err => {
                if(err) throw new Error(err);
            })
        });
        
    }

    ergodicFile(path){
        const {dir} = this.options;
        path = path || dir;
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
        try {
            let hashData = fs.readFileSync('./hash.txt', 'utf8')
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
            // console.log(e)
            callback && callback();
        }
    }
}

module.exports = QNManage;