Heimdallr
---

Keep watch over all your project PRs.

Features
---
* Helps you keep track of activity over many repositories
* Provides quick access to each PR, select one and hit Enter to open it in your default browser
* Keeps track of which activity you've reviewed per PR
* Shows reviewers and their status
  * Green for Approved
  * Yellow for Not Reviewed
  * Red for Needs Work

Usage
---

First set your environment variables. For the token, create a "Personal Access Token" in your profile page.

```
HEIMDALLR_URL="https://some.bitbucket.url/rest/api/1.0
HEIMDALLR_PROJECT="PROJECT-NAME"
HEIMDALLR_TOKEN="YOUR-TOKEN"
HEIMDALLR_EMAIL="a@b.c"
```

Then install it globally for usage.
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
