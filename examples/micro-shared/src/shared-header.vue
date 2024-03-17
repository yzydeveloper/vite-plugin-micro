<template>
    <header class="shared-header">
        <div class="shared-header-logo">
            Logo
        </div>
        <div class="shared-header-nav">
            <slot></slot>
        </div>
    </header>
</template>
<style>
.shared-header {
    height: 48px;
    display: flex;
    align-items: center;
    font-weight: bold;
    color: #000000;
    background: #cccccc;
}

.shared-header-logo {
    position: absolute;
}
.shared-header-nav {
    margin: 0 auto;
}

</style>
