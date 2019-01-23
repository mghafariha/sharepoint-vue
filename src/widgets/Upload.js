// @flow
import { mapActions } from 'vuex'
// import { uploadFile, getListItem, updateListItem, deleteListItem } from '../api'
import jQuery from 'jquery'
import uuidv1 from 'uuid/v1'
import R from 'ramda'

export default {
    inject: ['$validator'],
    template: `
    <el-tooltip :disabled="!hasError" class="item" effect="dark" :content="errorMessage" placement="top-end">
        <el-upload
            :class="[{'error-box': hasError}, 'upload-demo']"
            ref="upload"
            action=""
            name="ctl00$PlaceHolderMain$UploadDocumentSection$ctl05$InputFile"
            :on-change="change"
            :on-remove="remove"
            :auto-upload=false
            :uploadFiles="fileList"
            :file-list="fileList"
        >
            <el-button size="small" type="primary">پیوست فایل</el-button>
            <div v-if='description' slot="tip" class="el-upload__tip description">{{description}}</div>
            <div v-if='volume > 0 || types[0] != ""' slot="tip" class="el-upload__tip">فایل های {{types.join('/')}} {{volumeMessage}} </div>
        </el-upload>
    </el-tooltip>
    `,
    props: [
        'value',
        'rules',
        'name',
        'lookupList',
        'types',
        'description',
        'volume'
    ],
    data() {
        return {
            fileList: [],
        }
    },
    computed: {
        hasError() { return this.rules.rules.required && this.fileList.length == 0 },
        errorMessage() { return 'پیوست فایل الزامی است' },
        volumeMessage() { return this.volume == 0 ? '' : `با حجم کمتر از ${this.volume/1000}kb` }
    },
    methods: {
        ...mapActions(['addError']),
        change(file) {
            this.fileList = []
            let getFile = getFileBuffer(file.raw);
            let Title = file.name
            let fileExtention = R.last(Title.split('.'))
            let FileName = uuidv1() + '.' + fileExtention
            if (!typeCheck(fileExtention, this.types)){
                return this.addError(`فقط فرمت های ${this.types.join('/')} قابل قبول می باشد`)
            }
            if (!volumeCheck(file.size, this.volume)) {
                return this.addError(`حجم فایل باید کمتر از ${this.volume/1000}kb باشد`)
            }
            if (typeCheck(fileExtention, this.types) && volumeCheck(file.size, this.volume)) {
                getFile
                    .then(arrayBuffer => {
                        let Content = arrayBuffer.split('base64,')[1]
                        this.fileList = [{ name: Title, url: '' }]
                        this.$emit('change', { FileName, Title, Content })
                    })
            }
        },
        remove() {
            this.$refs.upload.clearFiles()
            this.fileList = []
            this.$emit('remove')
        }
    }
}

const getFileBuffer = data => {
    var deferred = jQuery.Deferred();
    var reader = new FileReader();
    reader.onloadend = function (e) {
        deferred.resolve(e.target.result);
    }
    reader.onerror = function (e) {
        deferred.reject(e.target.error);
    }
    reader.readAsDataURL(data);
    return deferred.promise();
}

const volumeCheck = (size, maxVolume) => R.or(maxVolume == 0, size <= maxVolume)

const typeCheck = (type, types) => R.or(types[0] == '', R.contains(type, types))
