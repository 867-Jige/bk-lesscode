<template>
    <div class="operation-list">
        <div class="filter">
            <bk-date-picker class="filter-item"
                v-model="filters.dateRange"
                type="daterange"
                placeholder="创建时间"
                @change="handleTimeChange"
                :shortcuts="dateShortcuts[0]">
            </bk-date-picker>
            <bk-input
                class="filter-item search-input"
                clearable
                placeholder="按应用名/ID搜索"
                right-icon="bk-icon icon-search"
                @clear="handleKeywordClear"
                @enter="handleKeywordEnter"
                v-model="filters.keyword">
            </bk-input>
            <export-button name="project" :list="list" :fields="exportFields" :remote-list="getAllData" />
        </div>
        <div class="data-list" v-bkloading="{ isLoading: fetching.base }">
            <bk-table
                class="g-hairless-table"
                v-show="!fetching.base"
                :data="list"
                :pagination="pagination"
                :outer-border="false"
                :header-border="false"
                :header-cell-style="{ background: '#f0f1f5' }"
                @page-change="handlePageChange"
                @page-limit-change="handlePageLimitChange"
                @sort-change="handleSortChange">
                <bk-table-column
                    v-for="column in columns"
                    :key="column.id"
                    :label="column.name"
                    :prop="column.id"
                    :width="column.width"
                    :sortable="column.sortable"
                    :show-overflow-tooltip="column.tooltip">
                    <template slot-scope="{ row }">
                        <loading v-if="column.dynamic" :loading="fetching[column.id]">
                            <span v-if="column.type === 'number'">{{row[column.id] | formatCount}}</span>
                            <span v-else>{{row[column.id]}}</span>
                        </loading>
                        <template v-else>
                            <span v-if="column.type === 'datetime'">{{row[column.id] | formatTime}}</span>
                            <span v-else>{{row[column.id]}}</span>
                        </template>
                    </template>
                </bk-table-column>
                <empty-status slot="empty" :type="emptyType" @clearSearch="handlerClearSearch"></empty-status>
            </bk-table>
        </div>
    </div>
</template>

<script>
    import http from '@/api'
    import Loading from '@/components/ui/loading.vue'
    import ExportButton from '../export-button.vue'
    import sharedMixin from '../shared-mixin.js'
    import tableListMixin from '../table-list-mixin.js'

    export default {
        components: {
            Loading,
            ExportButton
        },
        mixins: [sharedMixin, tableListMixin],
        data () {
            return {
                list: [],
                pagination: {
                    current: 1,
                    count: 0,
                    limit: 10
                },
                orderBy: undefined,
                columns: [
                    { id: 'projectName', name: '应用名', tooltip: true },
                    { id: 'createUser', name: '创建者', tooltip: true },
                    { id: 'projectCode', name: '应用ID', tooltip: true },
                    { id: 'pageCount', name: '应用页面数', sortable: 'custom', dynamic: true, type: 'number' },
                    { id: 'createTime', name: '创建时间', sortable: 'custom', type: 'datetime' }
                ],
                filters: {
                    keyword: '',
                    dateRange: []
                },
                fetching: {
                    base: false
                },
                emptyType: 'noData'
            }
        },
        computed: {
            params () {
                const params = {
                    q: this.filters.keyword,
                    time: this.timeParam, // mixin
                    pageSize: this.pagination.limit,
                    pageNum: this.pagination.current,
                    orderBy: this.orderBy
                }
                return params
            }
        },
        created () {
            this.setFetching()
            this.fetchData()
        },
        methods: {
            fetchData () {
                this.getProjectBase()
            },
            async getProjectBase () {
                this.fetching.base = true
                const dateRanges = this.filters.dateRange?.filter(item => item)
                if (this.filters.keyword || dateRanges?.length) {
                    this.emptyType = 'search'
                } else {
                    this.emptyType = 'noData'
                }
                try {
                    const { data: [list, total] } = await http.post('/operation/stats/project/base', this.params)
                    this.list = list.map((item) => ({
                        ...item,
                        ...this.getDynamicValues()
                    }))
                    this.pagination.count = total

                    if (this.list && this.list.length) {
                        this.getMoreData()
                    }
                } catch (e) {
                    console.error(e)
                } finally {
                    this.fetching.base = false
                }
            },
            getMoreData () {
                this.getProjectPageCount()
            },
            async getProjectPageCount () {
                const projectIds = this.list.map(item => item.id)
                this.fetching.pageCount = true
                try {
                    const { data: countList } = await http.post('/operation/stats/project/pageCount', { projectIds })
                    countList.forEach((item) => {
                        const updateItem = this.list.find(project => project.id === item.projectId)
                        updateItem.pageCount = Number(item.count)
                    })
                } catch (e) {
                    console.error(e)
                } finally {
                    this.fetching.pageCount = false
                }
            },
            async getAllData () {
                const total = this.pagination.count
                let index = 1

                if (this.list.length === total) {
                    return this.list
                }

                const pageSize = 500

                // 分页方法
                const page = index => ({ pageNum: index, pageSize })

                // 请求列表的req
                const req = index => http.post('/operation/stats/project/base', {
                    ...this.params,
                    ...page(index)
                })

                // 列表一共要拉取多少次
                const max = Math.ceil(total / pageSize)

                // 循环组装得到所有的req
                const baseReqs = []
                const pageCountReqs = []
                while (index <= max) {
                    baseReqs.push(req(index))
                    index += 1
                }

                const baseAll = await Promise.all(baseReqs)

                const results = []

                baseAll.forEach(({ data: [list] }) => {
                    const newList = list.map((item) => ({
                        ...item,
                        ...this.getDynamicValues()
                    }))
                    results.push(...newList)

                    const projectIds = newList.map(item => item.id)
                    pageCountReqs.push(http.post('/operation/stats/project/pageCount', { projectIds }))
                })

                const pageCountAll = await Promise.all(pageCountReqs)

                pageCountAll.forEach(({ data: countList }) => {
                    countList.forEach((item) => {
                        const updateItem = results.find(project => project.id === item.projectId)
                        updateItem.pageCount = Number(item.count)
                    })
                })

                return results
            },
            handlerClearSearch () {
                this.filters.dateRange = []
                this.filters.keyword = ''
                this.handleKeywordClear()
            }
        }
    }
</script>
