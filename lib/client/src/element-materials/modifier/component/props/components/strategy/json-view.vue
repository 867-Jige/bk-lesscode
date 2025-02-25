<!--
  Tencent is pleased to support the open source community by making 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) available.
  Copyright (C) 2017-2019 THL A29 Limited, a Tencent company. All rights reserved.
  Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://opensource.org/licenses/MIT
  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
-->

<template>
    <section>
        <section v-if="showInput">
            <bk-input
                class="json-textarea"
                disabled
                style="width: 100%"
                type="textarea"
                :rows="5"
                :value="initJsonStr" />
            <div
                v-if="!readonly"
                class="option-add"
                @click="showEdit">
                编辑数据
            </div>
        </section>

        <bk-dialog
            v-model="isShow"
            :confirm-fn="confirm"
            :position="{ top: 100 }"
            @cancel="cancel"
            render-directive="if"
            width="900"
            ext-cls="json-setting-dialog">
            <div class="dialog-title" v-if="!showInput">
                <bk-upload
                    :theme="'button'"
                    :tip="`可导入JSON文件或输入JSON数据`"
                    with-credentials
                    :multiple="false"
                    :url="uploadUrl"
                    accept=".json"
                    @on-success="handleUploadSuccess"
                ></bk-upload>
            </div>
            <main class="main-container" :style="{ 'height': showInput ? '450px' : '350px' }">
                <div class="init-json">
                    <textarea class="json-input" placeholder="请输入JSON格式的数据" v-model="initJsonStr"></textarea>
                </div>
                <div class="transform-json">
                    <json-viewer
                        :value="initJson"
                        :expand-depth="5"
                    ></json-viewer>
                </div>
            </main>
        </bk-dialog>
    </section>
</template>

<script>
    import Vue from 'vue'
    import { circleJSON } from '@/common/util.js'
    import JsonViewer from 'vue-json-viewer'
    import LC from '@/element-materials/core'
    Vue.use(JsonViewer)
    export default {
        props: {
            showInput: {
                type: Boolean,
                default: true
            },
            defaultValue: {
                type: [Object, Array, String],
                required: true
            },
            change: {
                type: Function,
                default: () => {}
            },
            name: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            readonly: {
                type: Boolean,
                default: false
            }
        },

        data () {
            return {
                isShow: false,
                initJsonStr: '',
                localValue: {}
            }
        },
        computed: {
            initJson () {
                if (this.initJsonStr) {
                    try {
                        return JSON.parse(this.initJsonStr)
                    } catch (e) {
                        return '解析error: ' + '请输入正确的JSON格式数据'
                    }
                }
                return {}
            },
            uploadUrl () {
                return `${process.env.BK_AJAX_URL_PREFIX}/page/importJson`
            }
        },
        watch: {
            defaultValue: {
                handler (defaultValue) {
                    if (this.isInnerChange) {
                        this.isInnerChange = false
                        return
                    }
                    this.localValue = defaultValue
                    this.initJsonStr = circleJSON(defaultValue, null, 4)
                },
                immediate: true
            }
        },
        methods: {
            triggerChange (name, value, type) {
                this.isInnerChange = true
                this.change(name, value, type)
                LC.triggerEventListener('refreshPreview')
            },
            showEdit () {
                this.isShow = true
            },
            confirm () {
                try {
                    if (this.initJsonStr && typeof JSON.parse(this.initJsonStr) === 'object') {
                        this.localValue = JSON.parse(this.initJsonStr)
                        if (!this.showInput) {
                            const initJsonArr = JSON.parse(this.initJsonStr)
                            if (!Array.isArray(initJsonArr) || initJsonArr.length === 0) {
                                this.$bkMessage({
                                    theme: 'error',
                                    message: '画布的JSON需要为Array且不能为空'
                                })
                                return
                            }
                            if (!initJsonArr[0]?.componentId) {
                                this.$bkMessage({
                                    theme: 'error',
                                    message: 'JSON格式不是画布所需的格式'
                                })
                                return
                            }
                            this.$bkInfo({
                                title: '',
                                subTitle: 'JSON会覆盖现有画布内容区域数据，请谨慎操作',
                                confirmFn: () => {
                                    this.triggerChange(this.name, initJsonArr, this.type)
                                    this.isShow = false
                                }
                            })
                        } else {
                            this.triggerChange(this.name, JSON.parse(this.initJsonStr), this.type)
                            this.isShow = false
                        }
                    }
                } catch (err) {
                    this.$bkMessage({
                        theme: 'error',
                        message: '请输入正确的JSON格式数据'
                    })
                }
            },
            cancel () {
                this.initJsonStr = circleJSON(this.localValue, null, 4)
            },
            handleUploadSuccess (res) {
                this.initJsonStr = res.responseData.data
            }
        }
    }
</script>

<style lang="postcss" scoped>
    @import "@/css/mixins/scroller";
    .json-setting-dialog {
        /deep/ .bk-dialog {
            position: initial;
            /* &.ease-enter-active.ease-enter-to {
                animation: none!important;
            } */
            .bk-dialog-content {
                top: calc(50vh - 324px)!important;
            }
        }
        .dialog-title {
            margin-left: 10px;
            font-size: 12px;
        }
        .main-container {
            width: 98%;
            display:flex;
            overflow: hidden;
            margin: 0 auto;
            border: solid 1px #E5EBEE;
            > div {
                border-right: solid 1px #E5EBEE;
                overflow: auto;
                @mixin scroller;
            }
            .init-json {
                flex: 1;
                overflow: hidden;
                margin-top: 10px;
                .json-input {
                    border: 0px;
                    width: 100%;
                    height: 100%;
                    @mixin scroller;
                }
            }
            .transform-json {
                flex: 1;
            }
        }
    }
    .option-add {
        font-size: 12px;
        cursor: pointer;
        color: #3a84ff;
        margin-top: 4px;
    }
    .json-textarea {
        /deep/ .bk-textarea-wrapper {
            border: none;
            .bk-form-textarea {
                @mixin scroller;
            }
        }
    }
</style>
