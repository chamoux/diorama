<script setup lang="ts">
import PlainLayout from '../Layouts/PlainLayout.vue'
import Nav from '../Components/Nav.vue'

defineOptions({ layout: PlainLayout })
</script>

<template>
  <Nav />
  <h1>No canvas</h1>
  <p>This page uses a different layout, so the canvas unmounts. Going back remounts it.</p>
</template>
