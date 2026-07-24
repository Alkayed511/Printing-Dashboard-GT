import re
with open("server.ts", "r") as f:
    text = f.read()

import_os = "import os from 'os';"
if "import os" not in text:
    text = text.replace("import fs from 'fs';", "import fs from 'fs';\nimport os from 'os';")

get_ip = """
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
"""

if "function getLocalIp" not in text:
    text = text.replace("const PORT = 3000;", "const PORT = 3000;\n" + get_ip)

old_res = "res.json({ success: true, config: serverConfig });"
new_res = "res.json({ success: true, config: { ...serverConfig, localIp: getLocalIp() } });"
text = text.replace(old_res, new_res)

old_get_res = "res.json(serverConfig);"
new_get_res = "res.json({ ...serverConfig, localIp: getLocalIp() });"
text = text.replace(old_get_res, new_get_res)

with open("server.ts", "w") as f:
    f.write(text)
