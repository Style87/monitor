var template = `<div class="modal fade" id="<%= _id %>" tabindex="-1" role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <%= options.headerTemplate(this) %>
      </div>
      <div class="modal-body">
        <%= options.bodyTemplate(this) %>
      </div>
      <div class="modal-footer">
        <%= options.footerTemplate(this) %>
      </div>
    </div>
  </div>
</div>`

export default template;