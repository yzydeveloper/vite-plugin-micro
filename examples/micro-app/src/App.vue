<template>
    <div class="container">
        <SharedHeader class="shared-header">
            <router-link to="/">SharedPage</router-link>
            <router-link to="/sub-app">SubApp</router-link>
        </SharedHeader>
        <div class="content">
            <router-view></router-view>
        </div>
        <SharedFooter class="shared-footer"></SharedFooter>
    </div>
</template>

<script setup>
// import remote module
import SharedHeader from '@micro/shared/header';
import SharedFooter from '@micro/shared/footer';
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body, #app {
    width: 100%;
    height: 100%;
}

.container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.shared-header a{
    margin-right: 8px;
}

.content {
    flex: 1;
    overflow-y: auto; /* 增加滚动 */
}
</style>
