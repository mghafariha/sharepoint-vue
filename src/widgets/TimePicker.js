// @flow

export default {
    inject: ['$validator'],
    template: `
    <el-tooltip :disabled="!hasError" class="item" effect="dark" :content="firstError" placement="top-end">
        <el-time-picker
            v-validate="rules"
            :class="{'error-box': hasError}"
            :data-vv-name='name'
            v-model="model"
            format="HH:mm"
            :clearable="false"
            @change="change"
        >
        </el-time-picker>
    </el-tooltip>
    `,
    props: ['value', 'rules', 'name'],
    data() {
        return {
            model: ''
        }
    },
    computed: {
        hasError() { return this.$validator.errors.has(this.name) },
        firstError() { return this.$validator.errors.first(this.name) }
    },
    methods: {
        change(value) {
            if (!value) value = null
            this.$emit('input', value)
            this.$emit('change', value)
        }
    }
}
