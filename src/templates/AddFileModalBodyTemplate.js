let template = `<input type="hidden" id="id" value="<%= options.file ? options.file.id : '' %>">

<div class="form-group">
    <label>Nickname</label>
    <input type="text" id="nickname" class="form-control" placeholder="Nickname" value="<%= options.file ? options.file.nickname : '' %>">
</div>

<div class="form-group">
    <label class="control-label" for="fullPath">File</label>
    <input type="text" id="fullPath" class="form-control" placeholder="File path and name" value="<%= options.file ? options.file.fullPath : '' %>">
    <span class="help-block">File doesn't exist.</span>
</div>

<div class="form-group">
    <label>Format</label>
    <input type="text" id="jsonFormat" class="form-control" value="<%= options.file ? options.file.jsonFormat : '' %>">
    <p class="help-block">Unserscore template to format the json line.</p>
</div>

<div class="form-group">
    <div id="colorpicker" class="input-group colorpicker-component">
        <span class="input-group-addon"><i></i></span>
        <input type="text" value="<%= options.file ? options.file.color : options.generateRandomColor()%>" class="form-control" />
    </div>
</div>

<div class="form-group">
    <label>Filter</label>
    <input type="text" id="filter" class="form-control" value="<%= options.file ? options.file.filter : '' %>">
    <p class="help-block">Filter logs from this file.</p>
</div>`

export { template };