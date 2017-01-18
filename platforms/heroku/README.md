# teleport-heroku
Deployment configuration for [teleport](https://github.com/snipsco/teleport) in the case of heroku infrastructure.

## Ontology
### backend
- domain: main subdomain of the app dns. By default herokuapp.com.
- helpersByName
  - heroku

### typesByName
- <key>
  - hasDns: TODO [REQUIRED]
  - abbreviation: special tag for apps. [REQUIRED]

## How to use it
Simply add it to the list of templates. For instance:
```
tpt -c --project my-app --templates teleport-flask-webrouter,teleport-heroku
```
