// @flow
import { mapActions, mapState } from 'vuex'
import UploadField from '../widgets/Upload'

export default {
    components: { UploadField },
    template: `
        <UploadField
            :value='value'
            :lookupList="lookupList"
            :name="name"
            :types="types"
            :volume="volume"
            :rules="rules"
            :description="description"
            @change='change'
            @remove='remove'
        />
    `,
    props: ['fieldId'],
    computed: {
        ...mapState({
            field(state) { return state.fields[this.fieldId] }
        }),
        value () { return this.field.value },
        lookupList () { return this.field.LookupList },
        name (){ return this.field.Title },
        types() { return this.field.TypeFile.split(',') },
        volume() { return this.field.VolumeFile * 1000 },
        description() { return this.field.Description },
        rules () {
            return {
                rules: {
                    required: this.field.IsRequire,
                }
            }
        }
    },
    methods: {
        ...mapActions(['addToAddFiles', 'removeFromAddFiles']),
        change({ FileName, Title, Content }){
            this.addToAddFiles({ id: this.fieldId, attachment: { InternalName: this.field.InternalName, LookupList: this.field.LookupList, FileName, Title, Content } })
        },
        remove(){
            this.removeFromAddFiles(this.fieldId)
        }
    }
}
