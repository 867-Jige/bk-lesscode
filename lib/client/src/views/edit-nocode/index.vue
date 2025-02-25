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
    <!-- 表单页面和表单管理页面 -->
    <main
        class="lessocde-editor-page"
        v-bkloading="{
            isLoading: isContentLoading
        }">
        <div class="lesscode-editor-page-header">
            <page-list />
            <div
                id="toolActionBox"
                class="function-and-tool">
                <operation-select v-model="operationType" :hide-json="['FORM_MANAGE', 'FLOW_MANAGE', 'MARKDOWN'].includes(nocodeType)" :hide-func="nocodeType === 'MARKDOWN'" />
                <!-- 保存、预览、快捷键等tool单独抽离 -->
                <action-tool :hide-clear="['FORM_MANAGE', 'FLOW_MANAGE', 'MARKDOWN'].includes(nocodeType)" :hide-func="nocodeType === 'MARKDOWN'" />
            </div>
            <div class="actions-links-area">
                <more-actions></more-actions>
                <extra-links :show-help-box="false" />
            </div>
        </div>
        <div class="lesscode-editor-page-content" ref="root" v-if="!isContentLoading">
            <operation-area :operation="operationType" :nocode-type="nocodeType" />
        </div>
    </main>
</template>
<script>
    import LC from '@/element-materials/core'
    import { mapGetters } from 'vuex'
    import ExtraLinks from '@/components/ui/extra-links'
    import PageList from '../index/components/page-list'
    import OperationSelect from './components/operation-select'
    import ActionTool from './components/action-tool'
    import OperationArea from './components/operation-area'
    import MoreActions from './components/more-actions/index'
    import PreviewMixin from './preview-mixin'

    export default {
        name: 'NocodePage',
        components: {
            PageList,
            ExtraLinks,
            OperationSelect,
            ActionTool,
            OperationArea,
            MoreActions
        },
        mixins: [PreviewMixin],
        data () {
            return {
                isContentLoading: true,
                operationType: 'edit'
            }
        },
        computed: {
            ...mapGetters('page', ['pageDetail']),
            ...mapGetters('layout', ['pageLayout']),
            ...mapGetters('projectVersion', {
                versionId: 'currentVersionId',
                versionName: 'currentVersionName',
                getInitialVersion: 'initialVersion'
            }),

            projectId () {
                return parseInt(this.$route.params.projectId)
            },
            pageId () {
                return parseInt(this.$route.params.pageId)
            },
            nocodeType () {
                return this.pageDetail.nocodeType || ''
            }
        },
        async created () {
            // 获取并设置当前版本信息
            this.$store.commit('projectVersion/setCurrentVersion', this.getInitialVersion())

            this.fetchData()
        },
        beforeDestroy () {
            this.clearContext()
            window.removeEventListener('beforeunload', this.beforeunloadConfirm)
        },
        beforeRouteLeave (to, from, next) {
            this.$bkInfo({
                title: '确认离开?',
                subTitle: '您将离开画布编辑页面，请确认相应修改已保存',
                confirmFn: async () => {
                    next()
                }
            })
        },
        methods: {
            /**
             * @desc 获取页面编辑基础数据
             */
            async fetchData () {
                try {
                    this.isContentLoading = true
                    const [pageDetail, pageList, projectDetail, functionData] = await Promise.all([
                        this.$store.dispatch('page/detail', { pageId: this.pageId }),
                        this.$store.dispatch('page/getList', {
                            projectId: this.projectId,
                            versionId: this.versionId
                        }),
                        this.$store.dispatch('project/detail', { projectId: this.projectId }),
                        this.$store.dispatch('functions/getAllGroupAndFunction', {
                            projectId: this.projectId,
                            versionId: this.versionId
                        }),

                        this.$store.dispatch('page/pageLockStatus', { pageId: this.pageId }),
                        this.$store.dispatch('route/getProjectPageRoute', {
                            projectId: this.projectId,
                            versionId: this.versionId
                        }),
                        this.$store.dispatch('layout/getPageLayout', { pageId: this.pageId }),
                        this.$store.dispatch('page/getPageSetting', {
                            pageId: this.pageId,
                            projectId: this.projectId,
                            versionId: this.versionId
                        })
                    ])
                    await this.$store.dispatch('variable/getAllVariable', {
                        projectId: this.projectId,
                        pageCode: pageDetail.pageCode,
                        versionId: this.versionId,
                        effectiveRange: 0
                    })
                    // console.log(pageDetail)
                    this.$store.commit('page/setPageDetail', pageDetail || {})
                    this.$store.commit('page/setPageList', pageList || [])
                    this.$store.commit('project/setCurrentProject', projectDetail || {})
                    this.$store.commit('functions/setFunctionData', functionData)

                    LC.pageStyle = pageDetail.styleSetting
                } catch (e) {
                    console.error(e)
                } finally {
                    this.isContentLoading = false
                }
            },
            /**
             * @desc 页面离开确认
             * @param { Object } event
             */
            beforeunloadConfirm (event) {
                const confirmationMessage = '...';
                (event || window.event).returnValue = confirmationMessage
                return confirmationMessage
            },
            clearContext () {
                this.$store.commit('page/setPageDetail', {})
                this.$store.commit('layout/setPageLayout', {})
            }
        }
    }
</script>
<style lang="postcss">
    $headerHeight: 52px;
    $pageHeaderHeight: 52px;

    .lessocde-editor-page {
        min-width: 1366px;
        height: calc(100vh - $headerHeight);
        margin-top: $headerHeight;
    }
    .lesscode-editor-page-header {
        position: relative;
        display: flex;
        justify-content: space-between;
        height: 52px;
        background: #fff;

        &:after{
            content: '';
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 99;
            height: 1px;
            box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.1);
        }

        .function-and-tool {
            position: relative;
            display: flex;
            flex: 1;
            justify-content: center;
            align-items: center;
        }
        .spilt-line {
            height: 22px;
            width: 1px;
            margin: 0 5px;
            background-color: #dcdee5;
        }
        .actions-links-area {
            margin-right: 10px;
            display: flex;
            align-items: center;
            .extra-links {
                width: auto;
            }
        }
    }
    .lesscode-editor-page-content{
        height: calc(100vh - $headerHeight - $pageHeaderHeight);
    }
</style>
