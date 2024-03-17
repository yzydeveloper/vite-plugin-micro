<template>
    <h1>{{ title }}</h1>
</template>
<script setup>
import { ref } from 'vue'

const title = ref('SharedPage')
</script>
<style>
h1 {
    color: #ffee00;
}
</style>
