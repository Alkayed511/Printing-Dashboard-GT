import re

with open("src/components/Navbar.tsx", "r") as f:
    text = f.read()

text = text.replace("<FileDown, MonitorPlay", "<FileDown")

with open("src/components/Navbar.tsx", "w") as f:
    f.write(text)
