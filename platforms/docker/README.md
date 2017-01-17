# teleport-snips
This is a template from the app https://github.com/snipsco/teleport. It helps you to build a server that is deployed with our particular snips docker/kubernetes config.

You can test yourself with

```
tpt -c --project my-app --templates teleport-flask-webrouter,teleport-snips
```
and then follow these instructions https://github.com/snipsco/teleport/blob/master/README.md#start-a-new-project

See for instance how this was used to deploy our slack bot https://github.com/snipsco/snips-sdk-ds/tree/master/tools/slack-sdk
