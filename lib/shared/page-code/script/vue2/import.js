import { camelCase, camelCaseTransformMerge } from 'change-case'

/**
 * @desc 返回import内容
 * @param { CodeModel } code
 * @returns { String }
 */
export default function (code) {
    let importStr = ''

    // preview 模板preview(previewSingle)不需要引入，已经全局引入
    if (['preview', 'previewSingle'].includes(code.pageType)) return importStr

    // 组件库安装提示
    importStr = `/**
     * 请先安装 bk-magic-vue 组件库、bkui-vue-complex 复合组件库${code.isUseElement ? '以及 element-ui 组件库' : ''}
     * bk-magic-vue 组件库: https://magicbox.bk.tencent.com/static_api/v3/components_vue/2.0/example/index.html#/install
     * bkui-vue-complex 复合组件库: https://github.com/TencentBlueKing/lesscode-comp${code.isUseElement ? '\n* element-ui 组件库: https://element.eleme.cn/#/zh-CN/component/installation' : ''}
     *
     * 如果页面使用了远程函数，单独使用本页面，需要确保项目 store 下有相应的方法，后端有相应的转发接口
     */
    `

    // 使用了h5容器
    if (code.isUseSwiper) {
        importStr += `
            /**
             * 请先安装 Swiper 相关依赖: npm install swiper@5.2.0 vue-awesome-swiper@4.1.1
             */
        `
        importStr += `
            import { Swiper, SwiperSlide } from 'vue-awesome-swiper'
            import 'swiper/css/swiper.css'
            import * as swiperAni from '@/common/swiper.animate.min.js'
            import '@/css/animate.min.css'`
    }

    // 使用了bkcharts
    if (code.isUseBkCharts) {
        importStr += `
            /**
             * 请先安装 bk-charts 相关依赖: npm install @blueking/bkcharts
             */
        `
        importStr += 'const bkCharts = require(\'@/components/bkCharts\')\n'
    }

    // 使用了echarts
    if (code.chartTypeArr && code.chartTypeArr.length) {
        importStr += `/**
            * 请先安装 echarts 相关依赖: npm install echarts vue-echarts
            * 更多使用请参考：https://github.com/ecomfe/vue-echarts#usage
            */
            const ECharts = require('vue-echarts/components/ECharts.vue')
            require('echarts/lib/component/tooltip')
            require('echarts/lib/component/title')
            require('echarts/lib/component/legend')
        `
        for (const i in code.chartTypeArr) {
            importStr += `require('echarts/lib/chart/${code.chartTypeArr[i]}')\n`
        }
    }

    // 表单、流程类型页面
    if (['FORM', 'FLOW'].includes(code.nocodeType)) {
        importStr += 'import ProcessForm from \'@/components/flow-form-comp/process-form\'\n'
    }
    if (['FORM_MANAGE', 'FLOW_MANAGE'].includes(code.nocodeType)) {
        importStr += 'import DataManage from \'@/components/flow-form-comp/data-manage\'\n'
    }

    // 查看源码和生成项目源码时， store相关提示 跟import相关方法
    if (code.hasLayout && ['projectCode', 'vueCode'].includes(code.pageType)) {
        if (code.pageType === 'vueCode') {
            importStr += `/**
                * 请在项目 store 里存入用户相关信息
                * 请在项目 common 里完善退出登陆相关方法
                */
            `
        }
        importStr += 'import { mapGetters } from \'vuex\'\n'
        importStr += 'import auth from \'@/common/auth\'\n'
    }

    // import页面使用到的自定义组件
    if (!['preview', 'previewSingle'].includes(code.pageType) && code.usingCustomArr && code.usingCustomArr.length) {
        // dev 和 t 环境，npm 包名字前面加了 test- 前缀，生成的变量名字应该去掉 test 前缀
        let forkUsingCustomArr = code.usingCustomArr
        if (process.env.BKPAAS_ENVIRONMENT !== 'prod') {
            forkUsingCustomArr = code.usingCustomArr.map(item => item.replace(/^test\-/, ''))
        }
        for (const i in code.usingCustomArr) {
            importStr += `const ${camelCase(forkUsingCustomArr[i], { transform: camelCaseTransformMerge })} = require('${code.npmConf.scopename}/${code.usingCustomArr[i]}')\n`
        }
    }
    // 生成项目源码时，需要import mixins文件
    if (code.pageType === 'projectCode' && (code.usingFuncCodes.length > 0 || code.exisLifyCycle.length > 0)) {
        importStr += 'import methodsMixin from \'@/mixins/methods-mixin\''
    }
    return importStr
}
