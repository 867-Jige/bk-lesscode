<template>
    <div class="extra-links">
        <div v-if="showHelpBox" class="link-item help-box" @click="helpClick" v-bk-tooltips="helpTooltips">
            <i class="dropdown-trigger-btn bk-icon icon-question-circle-shape" />
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            showHelpBox: {
                type: Boolean,
                default: false
            },
            helpClick: {
                type: Function,
                default: () => {}
            },
            helpTooltips: {
                type: Object,
                default: () => ({
                    content: '帮助',
                    placements: ['bottom']
                })
            }
        },
        data () {
            return {
                routeName: 'start'
            }
        },
        watch: {
            '$route': {
                handler (to, from) {
                    if (to.name === 'functionManage') {
                        this.routeName = 'method'
                    } else if (to.name === 'componentManage') {
                        this.routeName = 'custom'
                    } else if (to.name === 'layout') {
                        this.routeName = 'layout-guide'
                    } else {
                        this.routeName = 'start'
                    }
                },
                immediate: true
            }
        },
        methods: {
        }
    }
</script>

<style lang="postcss">
    .extra-links {
        display: flex;
        width: 301px;
        align-items: center;
        justify-content: flex-end;
        .link-item {
            margin-right: 10px;
        }
        .help-box{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            font-size: 14px;
            color: #63656E;
            border-radius: 50%;
            cursor: pointer;
            &:hover{
                color: #3A84FF;
                background: #F0F1F5;
            }
        }
    }
    .extra-links-theme{
        padding: 7px 0 !important;
        border: 1px solid #dcdee5;
        .extra-links-popover-panel{
            & > *{
                display: block;
                height: 32px;
                line-height: 33px;
                padding: 0 16px;
                color: #63656e;
                font-size: 12px;
                text-decoration: none;
                white-space: nowrap;
                cursor: pointer;
                &:hover{
                    background-color: #eaf3ff;
                    color: #3a84ff;
                }
            }
        }
    }
</style>
