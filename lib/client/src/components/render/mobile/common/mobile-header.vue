<template>
    <div :class="$style['phone-header']" :style="{ height: height + 'px' }">
        <div :class="$style['header-left']">
            <span class="bk-drag-cellular-connection bk-drag-icon bk-drag mr5"></span>
            <span class="mr5">iPhone</span>
            <span class="mr5">5G</span>
        </div>
        <div :class="$style['header-mid']">{{time}}</div>
        <div :class="$style['header-right']">
            <span>100%</span>
            <span class="bk-drag-battery bk-drag-icon bk-drag ml5"></span>
        </div>
    </div>
</template>

<script>
    
    import headerHeight from './mobile-header-height'
    export default {
        setup () {
            const { height, time } = headerHeight()
            return {
                height,
                time
            }
        }
    }
</script>
<style lang="postcss" module>
.phone-header {
  display: flex;
  background: #fff;
  padding: 8px 18px;
  font-size: 12px;
  color: #000;
  transform: translateX(-5px);
  div {
    flex: 1;
  }
  .header-left {
    flex: 4;
  }
  .header-mid {
    flex: 2;
    text-align: center;
  }
  .header-right {
    flex: 4;
    text-align: right;
    align-items: center;
  }
}
</style>
