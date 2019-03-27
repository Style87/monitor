let template = `<input type="hidden" id="id" value="<%= options.file ? options.file.id : '' %>">
<p class="help-block">To filter out use the following expression replacing <i>SearchTerm</i> with your value. <b>^((?!SearchTerm)[\\s\\S])*$</b></p>

<div class="form-group">
  <label>Global Filter</label>
  <input type="text" id="global-filter" class="form-control" value="<%= options.settings.filter %>">
  <p class="help-block">Filter all logs.</p>
</div>

<div class="form-group">
    <label>File Filter</label>
    <input type="text" id="file-filter" class="form-control" value="<%= options.file ? options.file.filter : '' %>">
    <p class="help-block">Filter logs from the file.</p>
</div>`

export { template };
