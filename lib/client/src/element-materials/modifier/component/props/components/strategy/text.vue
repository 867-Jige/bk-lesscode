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
    <div>
        <div class="text-action">
            <textarea
                rows="5"
                style="height: auto; word-break: break-all;"
                class="bk-form-textarea"
                :class="isError && 'king-input-modifier-style-error'"
                v-model="renderValue"
                @input="handleChange" />
            <p class="modifier-input-error-text" v-if="isError">{{describe.regErrorText || '格式错误，请重新输入'}}</p>
        </div>
    </div>
</template>

<script>
    import { unescapeHtml } from '@/common/util'

    export default {
        props: {
            defaultValue: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            describe: {
                type: Object,
                required: true
            },
            change: {
                type: Function,
                required: true
            }
        },
        data () {
            return {
                isError: false,
                renderValue: ''
            }
        },
        watch: {
            defaultValue: {
                handler (v) {
                    this.renderValue = unescapeHtml(v)
                },
                immediate: true
            }
        },
        methods: {
            handleChange (e) {
                const val = this.renderValue
                const { regExp } = this.describe
                if (regExp) {
                    if (regExp.test(val)) {
                        this.change(
                            this.name,
                            val.replace(
                                new RegExp('(<)([^>]+)(>)', 'gi'),
                                (match, p1, p2, p3, offset, string) => `\\${p1}` + p2 + `\\${p3}`
                            ),
                            this.type
                        )
                        this.isError = false
                    } else {
                        this.isError = true
                    }
                } else {
                    this.change(
                        this.name,
                        val.replace(
                            new RegExp('(<)([^>]+)(>)', 'gi'),
                            (match, p1, p2, p3, offset, string) => `\\${p1}` + p2 + `\\${p3}`
                        ),
                        this.type
                    )
                }
            }
        }
    }
</script>

<style lang='postcss'>
    .text-title {
        height: 32px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
    }
    .text-action {
        display: flex;
        flex-direction: column;
    }
</style>
