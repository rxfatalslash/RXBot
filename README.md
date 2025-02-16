<div align="center">
    <img src="https://i.imgur.com/iiXUS2V.png" width="200px">
    
### Node.js Discord Bot

A simple Discord Bot made with Node.js
</div>

# Index
* ### [🗳️ Installation](#🗳️-installation)
* ### [🖱️ Use](#🖱️-use)
* ### [📋 License](#📋-license)

# 🗳️ Installation
Clone the repository.
```
git clone git@github.com:rxfatalslash/dscbot.git
cd RXBot/
```

# 🖱️ Use
Enter your own values in the **.env** file.
```
BOT_TOKEN="BOT_TOKEN"
CLIENT_ID="CLIENT_ID"
GUILD_IDS="GUILD_IDS"
CAT_API_KEY="CAT_API_KEY"
CUTTLY_API_KEY="CUTTLY_API_KEY"
```
Use Docker Compose or Dockerfile to start the application.
<br>
- ## Docker Compose:
```
docker-compose up --build -d
```
- ## Dockerfile:
```
docker build -t rxbot .
docker run -d --name rxbot -p 3000:3000 -v ./log:/app/log -e NODE_ENV=production dscbot
```

# 📋 License
This project is licensed under the terms of the [GNU General Public License, version 3](https://www.gnu.org/licenses/gpl-3.0.html) (GPLv3).

## LICENSE SUMMARY
### Permissions:

* **FREEDOM TO USE:** You are free to use, modify, and distribute this software.

* **SOURCE CODE ACCESS:** You must provide access to the source code of any modified versions of the software under the same GPLv3 license.

### Conditions:

* **COPYLEFT:** Any derivative work must also be open-source and distributed under the GPLv3 license.

* **NOTICES:** When distributing the software, you must include a copy of the GPLv3 license and provide appropriate notices.

### Limitations:

* **NO WARRANTY:** The software is provided as-is with no warranties or guarantees.

* **LIABILITY:** The authors or copyright holders are not liable for any damages or issues arising from the use of the software.

<a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">
  <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/GPLv3_Logo.svg" width="80" height="15" />
</a>