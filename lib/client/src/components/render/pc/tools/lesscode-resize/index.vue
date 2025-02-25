<template>
    <div
        ref="resizeRef"
        @click.stop=""
        @contextmenu.stop="handleShowMenu">
        <div
            :class="$style['achor']"
            :style="dotWidthStyles"
            @mousedown="handleResizeWidth" />
        <div
            :class="$style['achor']"
            :style="dotHeightStyles"
            @mousedown="handleResizeHeight" />
        <div
            :class="$style['achor']"
            :style="dotBothStyles"
            @mousedown="handleResizeBoth" />
        <div
            ref="tipRef"
            :style="tipStyles">
            {{ size.width }} x {{ size.height }}
        </div>
        <div
            :class="$style['width-actions']"
            :style="fullWidthStyles">
            <div
                v-bk-tooltips.right="'宽度随内容自适应'"
                :class="[$style['btn'], $style['auto-width']]"
                @click="handleAutoWidth">
                <i class="bk-drag-icon bk-drag-xiangxiazishiying" />
            </div>
            <div
                v-bk-tooltips.right="'宽度撑满'"
                :class="$style['btn']"
                @click="handleFullWidth">
                <i class="bk-drag-icon bk-drag-zuoyouchengkai" />
            </div>
        </div>
        <div
            v-bk-tooltips.bottom="'高度随内容自适应'"
            :class="$style['btn']"
            :style="autoHeightStyles"
            @click="handleAutoHeight">
            <i class="bk-drag-icon bk-drag-xiangxiazishiying" />
        </div>
    </div>
</template>
<script>
    import {
        ref,
        reactive,
        toRefs
    } from '@vue/composition-api'
    import useComponentActive from '../hooks/use-component-active'
    import useShowMenu from '../hooks/use-show-menu'
    import useResize from './hooks/use-resize'
    import useAutoHeight from './hooks/use-auto-height'
    import useFullWidth from './hooks/use-full-width'
    import useAutoWidth from './hooks/use-auto-width'
    import { isFreeLayoutProperty } from '@/element-materials/core/helper/utils.js'

    const baseStyles = {
        position: 'absolute',
        zIndex: 100000002
    }

    const hideStyles = {
        display: 'none'
    }

    const halfDotSize = 8
    const actionBtnSize = 24
    const actionBtnOffset = 8

    export default {
        setup () {
            const state = reactive({
                dotWidthStyles: hideStyles,
                dotHeightStyles: hideStyles,
                dotBothStyles: hideStyles,
                fullWidthStyles: hideStyles,
                autoHeightStyles: hideStyles
            })

            const resizeRef = ref()
            const tipRef = ref()

            /**
             * @desc 选中状态
             * @param { Node } componentData
             */
            const showActive = (componentData = {}) => {
                state.dotWidthStyles = hideStyles
                state.dotHeightStyles = hideStyles
                state.dotBothStyles = hideStyles
                state.fullWidthStyles = hideStyles
                state.autoHeightStyles = hideStyles
                if (!componentData.componentId) {
                    return
                }

                // 解析styles配置，是否支持width、height配置
                const styleConfig = componentData.material.styles || []
                let resizeWidthEnabel = false
                let resizeHeightEnable = false
                styleConfig.forEach(styleItem => {
                    if (styleItem === 'size') {
                        resizeWidthEnabel = true
                        resizeHeightEnable = true
                        return
                    }
                    if (styleItem.name === 'size') {
                        if (styleItem.include) {
                            resizeWidthEnabel = styleItem.include.includes('width')
                            resizeHeightEnable = styleItem.include.includes('height')
                        }
                        if (styleItem.exclude) {
                            resizeWidthEnabel = !styleItem.exclude.includes('width')
                            resizeHeightEnable = !styleItem.exclude.includes('height')
                        }
                    }
                })

                const {
                    top: containerTop,
                    left: containerLeft,
                    right: containerRight
                } = document.body.querySelector('#drawTarget').getBoundingClientRect()
                const {
                    top,
                    left,
                    right,
                    width,
                    height
                } = componentData.$elm.getBoundingClientRect()

                const dotBaseStyle = Object.assign({}, baseStyles)

                if (resizeWidthEnabel) {
                    state.dotWidthStyles = Object.assign({}, dotBaseStyle, {
                        top: `${top - containerTop + height / 2 - halfDotSize}px`,
                        left: `${right - halfDotSize - containerLeft}px`,
                        cursor: 'col-resize'
                    })
                    // 100% 宽度按钮的位置
                    let fullWidthBtnLeft = right - containerLeft + actionBtnOffset
                    if (right + 20 >= containerRight) {
                        fullWidthBtnLeft = right - containerLeft - (actionBtnSize + actionBtnOffset)
                    }
                    state.fullWidthStyles = Object.assign({}, dotBaseStyle, {
                        top: `${top - containerTop + height / 2 - actionBtnSize / 2}px`,
                        left: `${fullWidthBtnLeft}px`
                    })
                }
                if (resizeHeightEnable) {
                    state.dotHeightStyles = Object.assign({}, dotBaseStyle, {
                        top: `${top + height - halfDotSize - containerTop}px`,
                        left: `${left - containerLeft + width / 2 - halfDotSize}px`,
                        cursor: 'row-resize'
                    })
                    // 高度自适应的按钮
                    // free-layout 不支持该功能，必须给定 height
                    if (!isFreeLayoutProperty(componentData.type)) {
                        state.autoHeightStyles = Object.assign({}, dotBaseStyle, {
                            top: `${top + height - containerTop + actionBtnOffset}px`,
                            left: `${left - containerLeft + width / 2 - actionBtnSize / 2}px`
                        })
                    }
                }

                if (resizeWidthEnabel && resizeHeightEnable) {
                    state.dotBothStyles = Object.assign({}, dotBaseStyle, {
                        top: `${top - containerTop + height - halfDotSize}px`,
                        left: `${left - containerLeft + width - halfDotSize}px`,
                        cursor: 'nwse-resize'
                    })
                }
            }

            const { activeComponentData } = useComponentActive(showActive)

            const {
                size,
                tipStyles,
                handleResizeWidth,
                handleResizeHeight,
                handleResizeBoth
            } = useResize()

            // 显示快捷面板
            const handleShowMenu = useShowMenu()

            const handleAutoHeight = useAutoHeight()

            const handleFullWidth = useFullWidth()

            const handleAutoWidth = useAutoWidth()

            return {
                ...toRefs(state),
                size,
                tipStyles,
                activeComponentData,
                resizeRef,
                tipRef,
                handleResizeWidth,
                handleResizeHeight,
                handleResizeBoth,
                handleShowMenu,
                handleAutoHeight,
                handleFullWidth,
                handleAutoWidth
            }
        }
    }
</script>
<style lang="postcss" module>
    .achor{
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 15px;
        width: 15px;

        &:after{
            content: '';
            position: absolute;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            border: 1px solid #3a84ff;
            background: #fff;
        }
    }
    .width-actions{
        position: relative;
        &:hover{
            .auto-width{
                transform: translateY(calc(-100% - 6px));
                opacity: 1;
                &:after{
                    content: '';
                    position: absolute;
                    height: 10px;
                    right: 0;
                    bottom: -10px;
                    left: 0;
                }
            }
        }
    }
    .btn{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        font-size: 10px;
        color: #979BA5;
        border-radius: 50%;
        border: 1px solid #DCDEE5;
        background: #fff;
        cursor: pointer;
        &:hover{
            color: #63656E;
        }
    }
    .auto-width{
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        z-index: -1;
        transition: all .15s;
        :global(.bk-drag-icon){
            transform: rotateZ(-90deg);
        }
    }
</style>
