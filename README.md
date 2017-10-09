# monitor
File watcher program able to decode json lines and apply a template to them.

Start by using the plus button in the upper left to add a new file to watch. The template form field accepts a valid underscore template such as <%= message %>. If a template is given the log line will be decoded as json and the resulting json object will be passed to the template.
