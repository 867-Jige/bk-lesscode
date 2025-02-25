<template>
    <div class="worksheet-data-wrapper">
        <bk-form ref="sourceForm" class="select-worksheet" form-type="vertical" :model="localVal" :rules="sourceRules">
            <bk-form-item label="数据表" property="tableName" :required="true" error-display-type="normal">
                <bk-select
                    placeholder="请选择数据表"
                    :value="localVal.tableName"
                    :clearable="false"
                    :searchable="true"
                    :disabled="formListLoading"
                    :loading="formListLoading"
                    @selected="handleSelectForm">
                    <bk-option
                        v-for="item in formList"
                        :key="item.tableName"
                        :id="item.tableName"
                        :name="`${item.formName}(${item.tableName})`">
                    </bk-option>
                </bk-select>
            </bk-form-item>
            <bk-form-item label="字段" property="field" :required="true" error-display-type="normal">
                <bk-select
                    v-model="localVal.field"
                    placeholder="请选择字段"
                    :clearable="false"
                    :searchable="true"
                    :disabled="fieldListLoading"
                    :loading="fieldListLoading"
                    @selected="update">
                    <bk-option
                        v-for="item in fieldList"
                        :key="item.key"
                        :id="item.key"
                        :name="`${item.name}(${item.key})`">
                    </bk-option>
                </bk-select>
            </bk-form-item>
        </bk-form>
        <div class="filter-rules-wrapper">
            <div class="connector-rule">
                <label>筛选条件</label>
                <bk-radio-group v-model="localVal.conditions.connector" @change="update">
                    <bk-radio value="and">且</bk-radio>
                    <bk-radio value="or">或</bk-radio>
                </bk-radio-group>
            </div>
            <div v-if="localVal.conditions.expressions && localVal.conditions.expressions.length > 0" class="condition-list">
                <div class="condition-item" v-for="(expression, index) in localVal.conditions.expressions" :key="index">
                    <bk-select
                        v-model="expression.key"
                        placeholder="字段"
                        style="width: 250px; margin-right: 8px"
                        :clearable="false"
                        @selected="handleSelectField(expression)">
                        <bk-option
                            v-for="item in fieldList"
                            :key="item.key"
                            :id="item.key"
                            :name="`${item.name}(${item.key})`">
                        </bk-option>
                    </bk-select>
                    <bk-select
                        v-model="expression.condition"
                        placeholder="逻辑"
                        style="width: 100px; margin-right: 8px"
                        :clearable="false"
                        @selected="update">
                        <bk-option
                            v-for="item in getConditionOptions(expression.key)"
                            :key="item.id"
                            :id="item.id"
                            :name="item.name">
                        </bk-option>
                    </bk-select>
                    <bk-select
                        v-if="useVariable"
                        v-model="expression.type"
                        placeholder="值类型"
                        style="width: 100px; margin-right: 8px"
                        :clearable="false"
                        @selected="handleSelectType(expression)">
                        <bk-option id="const" name="值"></bk-option>
                        <bk-option id="field" name="引用变量"></bk-option>
                    </bk-select>
                    <bk-select
                        v-if="expression.type === 'field'"
                        v-model="expression.value"
                        placeholder="选择变量"
                        style="width: 140px"
                        :clearable="false"
                        :loading="relationListLoading"
                        :disabled="relationListLoading"
                        @selected="update">
                        <bk-option
                            v-for="item in relationList"
                            :key="item.key"
                            :id="item.key"
                            :name="`${item.name}(${item.key})`">
                        </bk-option>
                    </bk-select>
                    <field-value
                        v-else
                        :style="{ width: useVariable ? '216px' : '320px' }"
                        :field="getField(expression.key)"
                        :value="expression.value"
                        @change="handleValChange(expression, $event)">
                    </field-value>
                    <div class="operate-btns" style="margin-left: 8px">
                        <i class="icon bk-drag-icon bk-drag-add-fill" @click="handleAddExpression(index)"></i>
                        <i class="icon bk-drag-icon bk-drag-reduce-fill" @click="handleDeleteExpression(index)">
                        </i>
                    </div>
                </div>
                <!--        <p v-if="errorTips" class="common-error-tips">请检查筛选条件</p>-->
            </div>
            <div v-else class="data-empty" @click="handleAddExpression(0)">点击添加</div>
        </div>
    </div>
</template>
<script>
    import cloneDeep from 'lodash.clonedeep'
    import { getFieldConditions } from '../../../../common/form'
    import FieldValue from '../fieldValue'
    import { mapGetters, mapState } from 'vuex'

    export default {
        name: 'WorksheetData',
        components: {
            FieldValue
        },
        props: {
            useVariable: {
                // 参数值是否支持引用变量
                type: Boolean,
                default: false
            },
            sourceTypeList: {
                type: Array,
                default: () => []
            },
            flowId: Number,
            nodeId: Number,
            value: Object
        },
        data () {
            return {
                localVal: cloneDeep(this.value),
                formList: [],
                formListLoading: false,
                fieldList: [],
                fieldListLoading: false,
                relationList: [],
                relationListLoading: false,
                errorTips: false,
                sourceRules: {
                    tableName: [
                        {
                            required: true,
                            message: '数据表为必填项',
                            trigger: 'blur'
                        }
                    ],
                    field: [
                        {
                            required: true,
                            trigger: 'blur',
                            message: '字段为必填项'
                        }
                    ]
                }
            }
        },
        computed: {
            ...mapGetters('projectVersion', { versionId: 'currentVersionId' }),
            ...mapState('nocode/formSetting', ['fieldsList'])
        },
        watch: {
            value (val, oldVal) {
                this.localVal = cloneDeep(val)
                if (val.id !== oldVal.id) {
                    this.getFormList()
                }
            }
        },
        async  created () {
            await this.getFormList()
            if (this.value.tableName) {
                this.getFieldList(this.value.tableName)
            }
            if (this.useVariable) {
                this.getRelationList()
            }
        },
        methods: {
            async getFormList () {
                try {
                    this.formListLoading = true
                    const params = {
                        projectId: this.$route.params.projectId,
                        versionId: this.versionId
                    }
                    const res = await this.$store.dispatch('nocode/formSetting/getFormList', params)
                    this.formList = res
                    this.formListLoading = false
                } catch (e) {
                    console.error(e)
                }
            },
            getFieldList (tableName) {
                this.fieldList = JSON.parse(this.formList.find(item => item.tableName === tableName).content)
            },
            getRelationList () {
                // try {
                //     this.relationListLoading = true
                //     const params = {
                //         workflow: this.flowId,
                //         state: this.nodeId
                //     }
                //     const res = await this.$store.dispatch('nocode/formSetting/getNodeVars', params)
                //     this.relationList = res.data.map((item) => {
                //         const { key, name } = item
                //         return { key, name }
                //     })
                // } catch (e) {
                //     console.error(e)
                // } finally {
                //     this.relationListLoading = false
                // }
                // 引用本表的下拉框和单选框字段
                const data = []
                this.fieldsList.forEach(item => {
                    if (['SELECT', 'RADIO'].includes(item.type)) {
                        data.push({
                            key: item.key,
                            name: item.name
                        })
                    }
                })
                this.relationList = data
            },
            // 筛选条件字段逻辑选项，不同类型的字段有不同的逻辑关系
            getConditionOptions (key) {
                if (key) {
                    const field = this.fieldList.find(i => i.key === key)
                    return field ? getFieldConditions(field.type) : []
                }
                return []
            },
            // 筛选条件字段
            getField (key) {
                if (key) {
                    return this.fieldList.find(item => item.key === key)
                }
                return {}
            },
            // 选择表单，清空已选数据
            handleSelectForm (val) {
                const form = this.formList.find(item => item.tableName === val)
                this.localVal.tableName = form.tableName
                this.localVal.conditions.expressions = []
                this.localVal.field = ''
                this.fieldList = JSON.parse(form.content)
                this.update()
            },
            // 选择筛选条件字段
            handleSelectField (expression) {
                expression.condition = ''
                expression.type = this.useVariable ? '' : 'const'
                expression.value = ''
                this.update()
            },
            // 选择字段值类型
            handleSelectType (expression) {
                expression.value = ''
                this.update()
            },
            // 选择引用变量
            handleSelectRelation () {
                this.update()
            },
            handleValChange (expression, val) {
                expression.value = val
                this.update()
            },
            // 增加筛选条件
            handleAddExpression (index) {
                this.localVal.conditions.expressions.splice(index + 1, 0, {
                    key: '',
                    condition: '',
                    type: this.useVariable ? '' : 'const',
                    value: ''
                })
            },
            // 删除筛选条件
            handleDeleteExpression (index) {
                this.localVal.conditions.expressions.splice(index, 1)
            },
            update () {
                this.$emit('update', cloneDeep(this.localVal))
            },
            validate () {
                this.$refs.sourceForm.validate()
                const sourceFormValid = this.localVal.tableName && this.localVal.field
                // const filterRuleValid = this.localVal.conditions.expressions.every((exp) => {
                //   const { key, condition, type, value } = exp;
                //   return key !== '' && condition !== '' && type !== '' && value !== '';
                // });
                // this.errorTips = !filterRuleValid;
                // return sourceFormValid && filterRuleValid;
                return sourceFormValid
            }
        }
    }
</script>
<style lang="postcss" scoped>
.worksheet-data-wrapper {
  .select-worksheet {
    display: flex;
    //align-items: center;

    .bk-form-item {
      margin-top: 0;
      flex: 1;
      /deep/ .bk-form-content{
        line-height: unset;
      }
      &:not(:last-of-type) {
        margin-right: 10px;
      }
    }
  }

  .filter-rules-wrapper {
    margin-top: 24px;
  }

  .connector-rule {
    display: flex;
    align-items: center;
    height: 20px;

    & > label {
      position: relative;
      margin-right: 30px;
      color: #63656e;
      font-size: 14px;
      white-space: nowrap;
    }
  }

  .condition-item {
    display: flex;
    align-items: center;
    margin-top: 16px;

    .operate-btns {
      color: #c4c6cc;
      cursor: pointer;
      user-select: none;

      .disabled {
        color: #dcdee5;
        cursor: not-allowed;
      }
    }
  }

  .data-empty {
    margin-top: 16px;
    padding: 24px 0;
    font-size: 12px;
    text-align: center;
    color: #dcdee5;
    border: 1px dashed #dcdee5;
    cursor: pointer;

    &:not(.disabled):hover {
      border-color: #3a84ff;
      color: #3a84ff;
    }

    &.disabled {
      cursor: not-allowed;
    }
  }
}
</style>
