Heimdallr
---

Keep watch over all your project PRs.

Features
---
* Helps you keep track of activity over many repositories
* Provides quick access to each PR, select one and hit Enter to open it in your default browser
* Keeps track of which activity you've reviewed per PR, including your activity outside of heimdallr.
* Shows reviewers and their status
  * Green for Approved
  * Yellow for Not Reviewed
  * Red for Needs Work

Usage
---

First create your config (`~/.heimdallrconfig.json`). For the token, create a "Personal Access Token" in your profile page.

```json
{
    "pageSize": 25,
    "sources": [
        {
            "type": "bitbucket",
            "baseUrl": "https://some.bitbucket.url/rest/api/1.0",
            "email": "some@email.com",
            "token": "YOUR-TOKEN",
            "projects": [
                "Project1",
                "Project2"
            ],
            "repositories": [
                {"project": "ExternalProject", "repository": "ExternalRepo"},
                {"project": "AnotherExternalProject", "repository": "AnotherExternalRepo"}
            ]
        },
        {
            "type": "github",
            "TBD": "TBD"
        }   
    ]
}
```

Then install it globally for usage. This same command can be used to update it later as well.
```
yarn install -g https://github.com/NiXXeD/heimdallr
```

Then use it!
```
heimdallr
```

Tech Used
---
* [NodeJS](https://github.com/nodejs) JavaScript runtime built on Chrome's V8 JavaScript engine.
* [inquirer](https://github.com/SBoudrias/Inquirer.js) A collection of common interactive command line user interfaces.
* [chalk](https://github.com/chalk/chalk) Terminal string styling done right
* [moment](https://github.com/moment/moment/) A JavaScript date library for parsing, validating, manipulating, and formatting dates.
