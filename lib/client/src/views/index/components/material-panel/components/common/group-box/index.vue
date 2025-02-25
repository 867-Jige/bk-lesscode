<template>
    <div class="drag-group-box">
        <div class="group-title" @click="handleToggle" v-bk-tooltips="{ content: groupName,disabled: !(groupName && groupName.length > 17),width: 400 }">
            <i
                class="bk-drag-icon bk-drag-arrow-down toggle-arrow"
                :class="{
                    floded: isFolded
                }" />
            <span>{{ groupName }}</span>
            <div
                v-if="$slots.tag"
                class="tag">
                <slot name="tag" />
            </div>
        </div>
        <template v-if="!isFolded">
            <bk-exception
                v-if="list.length < 1"
                class="group-list-empty"
                type="empty"
                scene="part">
                <span>暂无数据</span>
            </bk-exception>
            <vue-draggable
                v-else
                :options="dragOptions"
                class="group-content"
                :list="list"
                :sort="false"
                :group="dragGroup"
                :force-fallback="false"
                ghost-class="source-ghost"
                chosen-class="source-chosen"
                drag-class="source-drag"
                :clone="cloneFunc"
                @choose="handleChoose($event, group)">
                <slot />
            </vue-draggable>
        </template>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex'
    import LC from '@/element-materials/core'
    import * as createHacker from './hacker'
    
    export default {
        props: {
            list: Array,
            // 分组展示名
            groupName: String,
            // 如果设置了 group
            // 则该 group-box 下所有拖拽组件统一为配置的 group 值
            // 为空，通过组件 type 动态计算 group 的值
            group: String,
            // 选中组件时的回调
            createFallback: Function,
            dragOptions: {
                type: Object,
                default: () => ({})
            },
            folded: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                dragGroup: {
                    name: 'component',
                    pull: 'clone',
                    put: false
                },
                isFolded: this.folded
            }
        },
        computed: {
            ...mapGetters('components', [
                'curNameMap'
            ])
        },
        created () {
            this.newNode = null
        },
        methods: {
            handleToggle () {
                this.isFolded = !this.isFolded
            },
            /**
             * @desc 左侧组件列表区域拖拽 choose 回调函数
             * @param {Object} event 事件对象
             */
            handleChoose (event) {
                if (typeof this.createFallback === 'function') {
                    this.newNode = this.createFallback(this.list, event.oldIndex)
                } else {
                    const materialConfig = this.list[event.oldIndex]
                    const node = LC.createNode(materialConfig.type)

                    Object.values(createHacker).forEach(task => task(node, materialConfig))

                    // 自定义组件
                    if (this.curNameMap[node.type]) {
                        node.setProperty('isCustomComponent', true)
                    }
                    // 交互式组件
                    if (LC.isInteractiveType(node.type)) {
                        node.setProperty('isInteractiveComponent', true)
                    }
                    this.newNode = node
                }
                
                let groupName = ''
                
                if (LC.isLayoutType(this.newNode.type)) {
                    groupName = 'layout'
                } else if (LC.isInteractiveType(this.newNode.type)) {
                    groupName = 'interactive'
                } else {
                    groupName = 'component'
                }

                this.dragGroup = Object.freeze({
                    ...this.dragGroup,
                    name: groupName
                })
            },
            cloneFunc () {
                return this.newNode
            }
            
        }
    }
</script>
<style lang="postcss">
    .drag-group-box{
        user-select: none;
        & ~ .drag-group-box{
            margin-top: 12px;
        }
        .group-title{
            position: relative;
            height: 40px;
            line-height: 38px;
            font-size: 14px;
            background: #F5F6FA;
            color: #63656E;
            padding-left: 42px;
            padding-right: 16px;
            border-top: 1px solid #DCDEE5;
            border-bottom: 1px solid #DCDEE5;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            overflow: hidden;
            .toggle-arrow{
                position: absolute;
                top: 7px;
                left: 16px;
                font-size: 24px;
                color: #979BA5;
                transition: all .1s linear;
                &.floded{
                    transform: rotate(-90deg);
                }
            }
            .tag{
                position: absolute;
                top: -8px;
                left: -26px;
                width: 64px;
                height: 30px;
                font-size: 12px;
                color: #fff;
                background: #3A84FF;
                transform: rotateZ(-45deg) scale(0.667);
                text-align: center;
            }
        }
        .group-list-empty{
            padding: 0 0 12px;
            .part-img{
                height: 72px;
            }
            .part-text {
                font-size: 12px;
                margin-top: -8px;
            }
        }
        .group-content{
            display: flex;
            flex-wrap: wrap;
            .render-drag-item{
                position: relative;
                width: 60px;
                height: 68px;
                text-align: center;
                color: #979BA5;
                border: 1px solid #DCDEE5;
                border-radius: 2px;
                background: #FAFBFD;
                margin-top: 10px;
                margin-left: 12px;
                cursor: pointer;
                &:hover{
                    border: 1px solid #3a84ff;
                    background: #3a84ff;
                    color: #fff;
                }
                .component-icon{
                    margin: 11px 0 2px 0;
                }
                .component-name{
                    font-size: 12px;
                    padding: 0 5px;
                    margin-top: 1px;
                    width: 100%;
                    overflow: hidden;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    display: -webkit-box;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: normal;
                    word-break: break-all;
                }
            }
            .render-drag-icon-item{
                width: 36px;
                height: 36px;
                margin-left: 12px;
                margin-top: 10px;
                background-color: #fafbfd;
                color: #979ba5;
                text-align: center;
                font-size: 16px;
                line-height: 36px;
                cursor: pointer;
                &:hover{
                    background: #3a84ff;
                    color: #fff;
                }
            }
        }
    }
</style>
