<template>
    <bk-form :label-width="180" :model="form" ref="funcForm" :form-type="formType" class="func-form-item">
        <bk-form-item
            label="函数简介"
            property="funcSummary"
            error-display-type="normal"
            :rules="[summaryRule]"
        >
            <bk-input
                type="textarea"
                placeholder="请输入函数简介"
                :rows="3"
                :maxlength="100"
                :disabled="disabled"
                :value="form.funcSummary"
                @input="(funcSummary) => updateValue({ funcSummary })">
            </bk-input>
        </bk-form-item>
    </bk-form>
</template>

<script>
    import mixins from './form-item-mixins'

    export default {
        mixins: [mixins],

        props: {
            requireSummary: {
                type: Boolean,
                default: false
            }
        },

        data () {
            return {
                summaryRule: {
                    validator: (val) => (!this.requireSummary || !['', undefined, null].includes(val)),
                    message: '函数简介必填',
                    trigger: 'blur'
                }
            }
        }
    }
</script>
