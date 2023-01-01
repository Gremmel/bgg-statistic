<template>
  <footer class="appFooter">
    <div class="bg-dark text-white p-1">
      <h2>Fußzeile</h2>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  props: {
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .appFooter {
    position: absolute;
    width: 100%;
    bottom: 0px;
  }
</style>
