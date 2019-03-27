var template = `
<div id="navigation" class="navbar navbar-inverse navbar-fixed-left">
  <div id="nav-buttons">
    <table class="table">
      <tr>
        <td id="add-file" valign="middle" data-toggle="tooltip" data-placement="bottom" title="Add a file">
          <i class="fa fa-plus nav-button"></i>
        </td>
        <td id="btn-clear-all" valign="middle" data-toggle="tooltip" data-placement="bottom" title="Clear all logs.">
          <i class="fa fa-times-rectangle-o nav-button"></i>
        </td>
        <td valign="middle" data-toggle="tooltip" data-placement="bottom" title="Toggle automatic scroll to bottom.">
          <i class="fa fa-sort-amount-asc nav-button"></i>
          <label class="switch">
            <input id="scroll-to-bottom" type="checkbox" checked>
            <span class="slider round"></span>
          </label>
        </td>
      </tr>
    </table>
  </div>
  <ul class="nav navbar-nav">
    <% _.forEach(collection, function(file, index){ %>
      <li>
        <label class="file" data-id="<%= file.id %>">
          <% if (file.error) {%>
            <i class="fa fa-exclamation-triangle text-danger" title="<%= file.errorMessage %>"></i>
          <% } else { %>
            <i class="fa fa-square" style="color:<%= file.color %>"></i>
          <% } %>
           <%= file.nickname %><br>
           <% if (file.filter) { %>
             <i class="fa fa-search btn-file-search" title="<%= file.filter %>" data-id="<%= file.id %>"></i>
          <% } %>
          <i class="fa fa-trash pull-right btn-control" data-action="remove" data-id="<%= file.id %>"></i>
          <i class="fa <%= file.play ? 'fa-pause' : 'fa-play' %> pull-right btn-control" data-action="<%= file.play ? 'pause' : 'play' %>" data-id="<%= file.id %>"></i>
          <i class="fa fa-times-rectangle-o pull-right btn-control" data-action="clear" data-id="<%= file.id %>"></i>
        </label>
      </li>
    <% }); %>
  </ul>
  <div id="settings" data-toggle="tooltip" data-placement="top" title="Settings">
    <i class="fa fa-gear nav-button"></i>
  </div>
</div>
`;

export default template;
