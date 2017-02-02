# teleport-heroku
[![npm version](https://badge.fury.io/js/teleport-heroku.svg)](https://badge.fury.io/js/teleport-heroku)

<table>
  <td>
    <img src="../icon.png" alt="icon" title="made by @cecilesnips"/>
  </td>
  <td>
    <img src="teleport-heroku.png" alt="icon" title="made by @cecilesnips"/>
  </td>
  <td>
    Deployment configuration for <a href="https://github.com/snipsco/teleport"> Teleport </a> in the case of heroku infrastructure.
  </td>
</table>

## Ontology
### backend
- domain: main subdomain of the app dns. By default herokuapp.com.
- helpersByName
  - heroku

### typesByName
- <key>
  - hasDns: does the app have a DNS? Default to true (heroku provide it). [REQUIRED]
  - abbreviation: special tag for apps. [REQUIRED]

## How to use it
Simply add it to the list of templates. For instance:
```
tpt -c --templates teleport-flask-webrouter,teleport-heroku
```
