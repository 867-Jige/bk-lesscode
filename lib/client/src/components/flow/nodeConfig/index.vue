<template>
    <div class="node-config-panel" v-bkloading="{ isLoading: nodeDetailLoading }">
        <div class="header-wrapper">
            <bk-button size="small" @click="handleClose">返回</bk-button>
            <h3 class="config-title">{{ typeName }}配置</h3>
        </div>
        <div class="config-content-wrapper">
            <component
                ref="nodeComp"
                :is="formCompDict[nodeData.type]"
                @close="handleClose">
            </component>
            <!-- <div class="extend-setting-btn">
                <span class="trigger-area" @click="extendSettingOpen = !extendSettingOpen">
                    高级配置
                    <i :class="['bk-icon', 'icon-angle-double-down', { opened: extendSettingOpen }]"></i>
                </span>
            </div>
            <form-section v-show="extendSettingOpen" title="触发器" desc="（可以定义当满足条件时，要执行的特定动作）">
                <div>触发器内容</div>
            </form-section> -->
            <node-actions
                :loading="nodeDetailLoading"
                :service-data="serviceData"
                @close="handleClose">
            </node-actions>
        </div>
    </div>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    import { NODE_TYPE_LIST } from '../constants/nodes.js'
    import { messageError } from '@/common/bkmagic'
    import NormalNode from './nodes/normal-node/index.vue'
    import DataProcessNode from './nodes/data-process-node.vue'
    import ApiNode from './nodes/api-node/index.vue'
    import ApprovalNode from './nodes/approval-node.vue'
    import FormSection from './components/form-section.vue'
    import NodeActions from './components/node-actions.vue'

    export default {
        name: 'NodeConfig',
        components: {
            NormalNode,
            DataProcessNode,
            ApiNode,
            ApprovalNode,
            FormSection,
            NodeActions
        },
        props: {
            nodeId: Number,
            serviceData: {
                type: Object,
                default: () => ({})
            },
            editable: {
                type: Boolean,
                default: true
            }
        },
        data () {
            return {
                nodeDetailLoading: true,
                formCompDict: {
                    NORMAL: 'NormalNode',
                    DATA_PROC: 'DataProcessNode',
                    TASK: 'ApiNode',
                    SIGN: 'SignNode',
                    APPROVAL: 'ApprovalNode'
                },
                extendSettingOpen: false
            }
        },
        computed: {
            ...mapGetters('projectVersion', { versionId: 'currentVersionId' }),
            ...mapState('nocode/nodeConfig', ['nodeData', 'isNodeDataChanged']),
            typeName () {
                if (this.nodeData.type) {
                    return NODE_TYPE_LIST.find(item => item.type === this.nodeData.type).name
                }
                return ''
            },
            projectId () {
                return this.$route.params.projectId
            }
        },
        created () {
            this.getNodeDetail()
        },
        beforeDestroy () {
            this.$store.commit('nocode/nodeConfig/clearNodeConfigData')
            this.$store.commit('nocode/flow/setDeletedPageId', null)
        },
        methods: {
            async getNodeDetail () {
                try {
                    this.nodeDetailLoading = true
                    const resp = await this.$store.dispatch('nocode/flow/getNodeConfig', this.nodeId)
                    // 人工节点添加表单配置数据，保存到流程服务节点配置中
                    if (resp.type === 'NORMAL' && !('formConfig' in resp.extras)) {
                        resp.extras.formConfig = { id: '', type: '' }
                    }
                    this.$store.commit('nocode/nodeConfig/setNodeData', resp)
                } catch (e) {
                    messageError(e.message || e)
                } finally {
                    this.nodeDetailLoading = false
                }
            },
            async validate () {
                if (typeof this.$refs.nodeComp.validate === 'function') {
                    return this.$refs.nodeComp.validate()
                }
                return true
            },
            handleClose () {
                if (!this.isNodeDataChanged) {
                    this.$emit('close')
                    return
                }
                this.$bkInfo({
                    title: '此操作会导致您的编辑没有保存，确认吗？',
                    type: 'warning',
                    width: 500,
                    confirmFn: () => {
                        this.$emit('close')
                    }
                })
            }
        }
    }
</script>
<style lang="postcss" scoped>
@import '@/css/mixins/scroller.css';

.node-config-panel {
    height: 100%;
    @mixin scroller;
}

.header-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 48px;
  height: 48px;
  background: #eaebf0;
  .config-title {
    margin-left: 16px;
    font-size: 14px;
    font-weight: bold;
    color: #313238;
  }
}
.config-content-wrapper {
  padding: 24px;
  height: calc(100% - 48px);
  overflow: auto;
  .extend-setting-btn {
      margin: 16px 0 24px;
      padding: 0 130px;
  }
  .trigger-area {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      color: #3a84ff;
      cursor: pointer;
      i {
          font-size: 18px;
          transition: transform 0.2s ease;
          &.opened {
              transform: rotate(-180deg);
          }
      }
  }
}
.actions-wrapper {
    margin-top: 24px;
    padding: 0 130px;
    .bk-button {
        min-width: 88px;
    }
}
</style>
