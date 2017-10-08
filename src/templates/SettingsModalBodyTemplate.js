let template = `<div id="settings-body">
  <h4>General</h4>
  <hr>
  <div class="settings-section">
    <div class="form-group">
      <label>Message Color</label>
      <div id="colorpicker" class="input-group colorpicker-component">
        <span class="input-group-addon"><i></i></span>
        <input type="text" value="<%= options.settings.color %>" class="form-control" />
      </div>
    </div>

    <div class="form-group">
      <label>Filter</label>
      <input type="text" id="filter" class="form-control" value="<%= options.settings.filter %>">
      <p class="help-block">Filter all logs.</p>
    </div>
  </div>

  <h4>Updates</h4>
  <hr>
  <div class="settings-section">
    <h5>
      <span id="action"></span>
      <span id="action-download"></span>
      <span id="action-install"></span>
      <span id="action-post-install"></span>
    </h5>
  </div>
</div>`;

export { template };