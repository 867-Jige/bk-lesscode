<template>
    <remote
        v-bind="$attrs"
        :payload="methodPayload"
        :default-value="copySlotVal.val"
        :remote-validate="slotConfig.remoteValidate"
        :change="remoteChange"
        :describe="slotConfig"
        :is-loading.sync="isLoading"
    />
</template>

<script>
    import Remote from '@/element-materials/modifier/component/props/components/strategy/remote'
    import safeStringify from '@/common/json-safe-stringify'

    export default {
        components: {
            Remote
        },

        props: {
            slotVal: {
                type: Object,
                required: true
            },
            slotConfig: {
                type: Object,
                default: () => ({})
            },
            type: {
                type: String
            },
            change: {
                type: Function,
                default: () => {}
            }
        },

        data () {
            return {
                copySlotVal: JSON.parse(safeStringify(this.slotVal)),
                isLoading: false
            }
        },

        computed: {
            methodPayload () {
                const payload = this.copySlotVal.payload || {}
                return payload.methodData || {}
            }
        },

        created () {
            // 防止响应式更新
            this.copyType = this.type
        },

        methods: {
            remoteChange (name, val, type, methodData) {
                // 更新 options
                this.updateOptions(Object.keys(val?.[0] || {}))
                // 更新值
                this.copySlotVal = {
                    ...this.copySlotVal,
                    val,
                    payload: {
                        methodData: {
                            ...this.methodPayload,
                            ...methodData
                        }
                    }
                }
                this.triggleUpdate()
            },

            triggleUpdate () {
                this.change(this.copySlotVal, this.copyType)
            },

            updateOptions (optionList) {
                this.$emit('option-change', optionList)
            }
        }
    }
</script>
