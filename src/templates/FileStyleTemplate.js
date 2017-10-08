let template = `<style id="file-style-<%= model.id %>" class="file-style">
  .file-nickname-<%= model.id %> {
    color: <%= model.color %>
  }
</style>`;

export { template };