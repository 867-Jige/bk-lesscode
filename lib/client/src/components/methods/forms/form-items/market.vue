<template>
    <section>
        <bk-form :label-width="130" ref="funcForm" :form-type="formType" class="func-market-home">
            <bk-form-item label="从函数市场导入">
                <bk-select
                    @toggle="getMarketFuncs"
                    @selected="changeMarketFunc"
                    :loading="isLoading"
                    :popover-options="{ boundary: 'window', appendTo: 'parent' }"
                    :disabled="disabled"
                >
                    <bk-option
                        v-for="option in marketFuncs"
                        :key="option.id"
                        :id="option.id"
                        :name="option.funcName">
                        <span class="market-function-name">
                            {{ option.funcName }}
                            <i class="bk-icon icon-info" v-bk-tooltips="getTips(option.funcSummary)"></i>
                        </span>
                    </bk-option>
                </bk-select>
                <i class="bk-icon icon-info mt10">可使用函数市场模板快速创建，注意：选择后会覆盖当前函数的数据</i>
            </bk-form-item>
        </bk-form>
        <h5 class="func-title">函数信息</h5>
    </section>
</template>

<script>
    import { transformTipsWidth } from '@/common/util'
    import mixins from './form-item-mixins'
    import { mapActions } from 'vuex'

    export default {
        mixins: [mixins],

        data () {
            return {
                isLoading: false,
                marketFuncs: []
            }
        },

        methods: {
            ...mapActions('functionMarket', ['getFunctionList']),

            getTips (funcSummary) {
                const tips = transformTipsWidth(funcSummary, 350)
                let tipObj = {
                    content: tips,
                    placement: 'left',
                    boundary: 'window'
                }
                if (typeof tips === 'object') {
                    tipObj = {
                        ...tipObj,
                        ...tips
                    }
                }
                return tipObj
            },

            getMarketFuncs (isExpand) {
                if (isExpand) {
                    this.isLoading = true
                    this.getFunctionList().then(res => {
                        this.marketFuncs = res || []
                    }).catch((err) => {
                        this.messageError(err.message || err)
                    }).finally(() => {
                        this.isLoading = false
                    })
                }
            },

            changeMarketFunc (funcId) {
                const { id, ...rest } = this.marketFuncs.find((func) => (func.id === funcId)) || {}
                this.updateValue(rest)
            }
        }
    }
</script>

<style lang="postcss" scoped>
    .func-market-home {
        background: #f0f1f5;
        border-radius: 2px;
        padding: 16px;
        /deep/ .bk-select {
            background: #fff;
        }
        /deep/ .bk-option-content {
            padding: 0;
            div {
                padding: 0 16px;
            }
        }
    }
    .func-title {
        font-weight: 700;
        font-size: 14px;
    }
    .market-function-name {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
    }
    .icon-info {
        display: block;
        text-align: left;
        line-height: 16px;
        font-size: 12px;
        &:before {
            margin-right: 4px;
        }
    }
</style>
