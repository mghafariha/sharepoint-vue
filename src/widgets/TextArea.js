// @flow

export default {
    inject: ['$validator'],
    template: `
    <el-tooltip :disabled="!hasError" class="item" effect="dark" :content="firstError" placement="top-end">
        <el-input
            v-validate="rules"
            v-model="model"
            :class="{'error-box': hasError}"
            :name='name'
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4}"
            @change="change"
        >
        </el-input>
    </el-tooltip>
    `,
    props: ['value', 'rules', 'name'],
    data() {
        return {
            model: null
        }
    },
    computed: {
        hasError() { return this.$validator.errors.has(this.name) },
        firstError() { return this.$validator.errors.first(this.name) }
    },
    methods: {
        change(value) {
            value = jsonEscape(value)
            this.$emit('input', value)
            this.$emit('change', value)
        }
    },
    mounted() {
        this.model = this.value ? this.value.replace(/\\n/g, '\\\n').replace(/\\/g, '') : ''
    }
}

const jsonEscape = str => str.replace(/\n/g, '\\\\n').replace(/\r/g, '\\\\r').replace(/\t/g, '\\\\t')
