<template>
    <section style="margin: 0 auto">
        <section v-if="createFromTemplate" class="template-container-page" v-bkloading="{ isLoading: pageLoading, opacity: 1 }">
            <div class="layout-left">
                <div class="filter-div">
                    <ul class="filter-links">
                        <li
                            v-for="link in filterLinks"
                            :key="link.id"
                            :class="['link-item', { 'active': filter === link.id }]"
                            @click="handleClickFilter(link.id)"
                            :title="link.name">
                            {{link.name}}
                        </li>
                    </ul>
                    <bk-input
                        clearable
                        :placeholder="'请输入模板名称'"
                        :right-icon="'bk-icon icon-search'"
                        :ext-cls="'search-input'"
                        v-model="searchFilter"
                        @enter="changeList"
                        @clear="changeList">
                    </bk-input>
                </div>
                <div class="template-container">
                    <div class="template-container-wrapper" v-show="!pageLoading">
                        <div class="page-template-list" v-show="!pageLoading">
                            <li v-for="template in list" :key="template.id"
                                :class="['list-item', { checked: template.checked }]"
                                @click="handleClickItem(template)">
                                <section>
                                    <div class="checkbox">
                                        <i class="bk-icon icon-check-1 checked-icon"></i>
                                    </div>
                                    <div class="layout-img">
                                        <img :src="getPreviewImg(template.previewImg)" alt="模板缩略预览">
                                        <div v-if="template.isOffcial && template.hasInstall === false" class="mask">
                                            <bk-button class="apply-btn" theme="primary" @click.stop="handleApply(template)">添加到本应用</bk-button>
                                        </div>
                                    </div>
                                </section>
                                <div class="layout-name">
                                    <span class="template-name" :title="template.templateName">{{ template.templateName }}</span>
                                    <span class="template-preview" @click.stop.prevent="handlePreview(template)">预览</span>
                                </div>
                                <span v-if="template.isOffcial" class="default-share-tag">共享</span>
                            </li>
                        </div>
                        <div class="empty" v-show="!list.length">
                            <empty-status :type="emptyType" @clearSearch="handlerClearSearch"></empty-status>
                        </div>
                    </div>
                </div>
            </div>
            <div class="layout-right">
                <slot />
            </div>
        </section>
    
        <template v-else>
            <div class="from-empty-template" :style="{ 'min-height': nocodeType ? '420px' : '', height: nocodeType ? '' : '490px' }">
                <slot />
            </div>
            
        </template>
        <template-edit-dialog ref="templateApplyDialog" action-type="apply" :refresh-list="applySuccess"></template-edit-dialog>
    </section>
</template>

<script>
    import { mapGetters } from 'vuex'
    import PreivewErrImg from '@/images/preview-error.png'
    import { PAGE_TEMPLATE_TYPE } from '@/common/constant'
    import TemplateEditDialog from '@/views/project/template-manage/components/template-edit-dialog'
    
    export default {
        name: 'page-from-template',
        components: {
            TemplateEditDialog
        },
        props: {
            platform: {
                type: String,
                default: 'PC'
            },
            nocodeType: {
                type: String,
                default: ''
            },
            createFromTemplate: {
                type: Boolean,
                default: false
            },
            templateChange: {
                type: Function,
                default: () => {}
            }
        },
        data () {
            return {
                filterLinks: [{ id: '', name: '全部' }],
                filter: '',
                searchFilter: '',
                templateList: [],
                list: [],
                pageLoading: false,
                currentTemplate: {},
                selectApplyTemplate: {},
                emptyType: 'noData'
            }
        },
        computed: {
            ...mapGetters('projectVersion', { versionId: 'currentVersionId' }),
            projectId () {
                return this.$route.params.projectId
            }
        },
        watch: {
            createFromTemplate (val) {
                if (val) {
                    this.initData()
                }
            },
            searchFilter (val) {
                if (!val) {
                    this.changeList()
                }
            }
        },
        methods: {
            async initData () {
                try {
                    this.pageLoading = true
                    this.filterLinks = [{ id: '', name: '全部' }]
                    const [projectTemplateGroups, projectTemplateList, tmpMarketTemplateList] = await Promise.all([
                        this.$store.dispatch('pageTemplate/categoryList', { projectId: this.projectId }),
                        this.$store.dispatch('pageTemplate/list', { projectId: this.projectId }),
                        this.$store.dispatch('pageTemplate/list', { type: 'OFFCIAL' })
                    ])
                    this.templateList = projectTemplateList
                    const marketTemplateList = tmpMarketTemplateList.map(item => ({
                        ...item,
                        hasInstall: projectTemplateList.filter(template => template.parentId === item.id).length > 0
                    }))
                    marketTemplateList.map(item => {
                        if (this.templateList.filter(template => (item.id === template.id)).length === 0) {
                            this.templateList.push(item)
                        }
                    })
                    this.filterLinks = this.filterLinks.concat(projectTemplateGroups.map(item => ({ id: item.id, name: item.name }))).concat(PAGE_TEMPLATE_TYPE)
                    this.changeList()
                } catch (err) {
                    this.$bkMessage({
                        theme: 'error',
                        message: err.message || err
                    })
                } finally {
                    this.pageLoading = false
                }
            },
            getPreviewImg (previewImg) {
                if (previewImg && previewImg.length > 20) {
                    return previewImg
                }
                return PreivewErrImg
            },
            changeList () {
                this.filterList = this.templateList
                if (this.filter) {
                    this.filterList = this.filterList.filter(item => item.offcialType === this.filter || item.categoryId === parseInt(this.filter))
                }
                if (this.searchFilter) {
                    this.emptyType = 'search'
                    this.filterList = this.filterList.filter(item => item.templateName.toUpperCase().includes(this.searchFilter.toUpperCase()))
                } else {
                    this.emptyType = 'noData'
                }
                this.list = this.filterList.filter(item => item.templateType === this.platform || (this.platform === 'PC' && !item.templateType))
                this.handleReSelect()
            },
            handleClickFilter (link) {
                this.filter = link
                this.changeList()
            },
            handleClickItem (template) {
                if (template.isOffcial && template.hasInstall === false) return
                template.checked = !template.checked
                this.list.map(function (item) {
                    if (item.id !== template.id && item.checked) {
                        item.checked = false
                    }
                    return item
                })
                if (!template.checked) {
                    this.currentTemplate = {}
                    this.templateChange({})
                } else {
                    this.currentTemplate = template
                    this.templateChange(template)
                }
            },
            handleReSelect () {
                const checked = this.templateList.find(item => item.checked)
                if (checked) checked.checked = false
                if (this.currentTemplate?.id) {
                    const template = this.list.find(item => item.id === this.currentTemplate?.id)
                    if (template) {
                        template.checked = true
                        this.templateChange(template)
                    } else {
                        this.currentTemplate = {}
                        this.templateChange({})
                    }
                }
            },
            handlePreview (template) {
                if (!template.content) {
                    this.$bkMessage({
                        theme: 'error',
                        message: '该页面为空页面，请先编辑页面'
                    })
                    return
                }
                window.open(`/preview-template/project/${template.belongProjectId}/${template.id}`, '_blank')
            },
            handleApply (template) {
                this.selectApplyTemplate = Object.assign({}, template)
                this.$refs.templateApplyDialog.isShow = true
                this.$refs.templateApplyDialog.templateId = template.id
                this.$refs.templateApplyDialog.fromTemplate = template
                this.$refs.templateApplyDialog.dialog.formData = {
                    categoryId: '',
                    belongProjectId: this.projectId,
                    templateName: template.templateName
                }
            },
            applySuccess (param = {}) {
                const template = this.list.find(item => item.id === this.selectApplyTemplate.id)
                if (param.templateName) {
                    template.templateName = param.templateName
                }
                if (template.id) {
                    template.hasInstall = true
                    this.currentTemplate = template
                    this.handleReSelect()
                }
                this.selectApplyTemplate = {}
            },
            handlerClearSearch (searchName) {
                this.searchFilter = searchName
            }
        }
    }
</script>

<style lang="postcss">
    @import "@/css/mixins/scroller";
    @import "@/css/mixins/ellipsis";

    .from-empty-template {
        width: 700px;
        margin-bottom: 20px;
        overflow-y: auto;
        @mixin scroller;
    }

    .template-container-page {
        display: flex;
        height: 510px;
        border-top: 1px solid #dcdee5;
        .layout-left {
            width: 681px;
            height: 100%;
            opacity: 1;
            background: #ffffff;
            padding-bottom: 20px;

            .filter-div {
                display: flex;
                align-content: space-between;
                margin-top: 10px;
                height: 32px;
            }
            .search-input {
                width: 178px;
            }
            .filter-links {
                display: flex;
                align-items: center;
                width: 480px;
                padding-left: 6px;
                overflow-x: auto;
                overflow-y: hidden;
                @mixin scroller;

                .link-item {
                    padding: 6px 12px;
                    margin: 0 8px;
                    border-radius: 16px;
                    cursor: pointer;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    &:hover {
                        background: #E1ECFF;
                    }

                    &.active {
                        background: #E1ECFF;
                        color: #3A84FF;
                    }
                }
            }

            .template-container{
                width: 100%;
                height: calc(100% - 72px);
                margin: 14px 0 0 18px;

                .template-container-wrapper{
                    width: calc(100% - 20px);
                    height: 100%;
                    overflow-y: auto;
                    @mixin scroller;

                    .empty{
                        margin-top: 100px;
                    }
                }
            }

            .page-template-list {
                width: 100%;
                display: flex;
                flex-wrap: wrap;

                .list-item {
                    position: relative;
                    flex: none;
                    display: flex;
                    flex-direction: column;
                    width: 206px;
                    height: 160px;
                    background: #ffffff;
                    border-radius: 2px;
                    cursor: pointer;
                    border: 1px solid #dcdee5;
                    margin-right: 10px;
                    margin-bottom: 10px;

                    &:nth-of-type(3n) {
                        margin-right: 0;
                    }

                    &:hover {
                        border-color: #3a84ff;
                        .layout-name .template-preview {
                            display: block;
                        }
                        .layout-img .mask .apply-btn {
                            display: block;
                        }
                    }

                    &.checked {
                        border-color: #3a84ff;
                        background: #e1ecff;
                        .checkbox {
                            display: block;
                        }
                        .layout-name .template-preview{
                            display: none;
                        }
                    }

                    .checkbox {
                        display: none;
                        position: absolute;
                        right: -1px;
                        bottom: -1px;
                        border-style: solid;
                        border-width: 0 0 30px 34px;
                        border-color: transparent transparent #3A84FF transparent;
                        .checked-icon {
                            position: absolute;
                            left: -20px;
                            top: 10px;
                            color: #fff;
                            font-size: 20px;
                        }
                    }

                    .layout-img {
                        position: relative;
                        width: 100%;
                        height: 128px;

                        &::before {
                            content: "";
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 128px;
                            /* background: rgba(0, 0, 0, 0.4); */
                        }

                        img {
                            width: 100%;
                            object-fit: contain;
                        }

                        .mask {
                            display: flex;
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.1);
                            align-items: center;
                            .apply-btn {
                                display: none;
                                margin-left: 42px;
                            }
                        }

                        .empty-preview-img {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            font-weight: 700;
                            color: #C4C6CC;
                            height: 100%;
                            background: #f0f1f5;
                            border-radius: 4px 4px 0px 0px;
                        }
                    }
                    .layout-name {
                        padding: 0 6px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        height: 32px;
                        width: 100%;

                        .template-name{
                            color: #63656e;
                            @mixin ellipsis 80%, block;
                        }

                        .template-preview {
                            display: none;
                            color: #3A84FF;
                        }
                    }

                    .default-share-tag {
                        position: absolute;
                        right: 6px;
                        top: 6px;
                        height: 22px;
                        line-height: 22px;
                        text-align: center;
                        border-radius: 2px;
                        font-size: 12px;
                        color: #fff;
                        padding: 0 6px;
                        background: #699DF4;
                    }
                }
            }
        }

        .layout-right {
            width: 399px;
            height: 100%;
            opacity: 1;
            background: #ffffff;
            border-left: 1px solid #dcdee5;
            padding: 20px;
            overflow-y: auto;
            @mixin scroller;
            
            .bk-form-control.control-prepend-group {
                background: #fff;
                .group-text {
                    padding: 0 8px;
                }
            }
        }
    }
</style>
