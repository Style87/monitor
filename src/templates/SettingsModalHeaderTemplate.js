let template = `
  <h3 class="modal-title">
    Settings
    <small class="pull-right">
      <%= options.env.name.toLowerCase() != 'production' ? options.env.name.substring(0,3) : '' %> ver. <%= options.version %>
    </small>
  </h3>
`;

export { template };