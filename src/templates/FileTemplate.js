var template = `<div class="file-line file-<%= model.id %> <%= filtered %>">
    <span class="file-nickname file-nickname-<%= model.id %>"><%= model.nickname %></span>
    <p class="file-line-text file-line-text-<%= model.id %>"><%= line %></p>
</div>`;

export default template;
