import re

with open("src/index.css", "r") as f:
    css = f.read()

# Replace --color-orange- with --color-primary- in @theme
css = css.replace("--color-orange-", "--color-primary-")
css = css.replace("--theme-orange-", "--theme-primary-")

# Replace --color-blue- with --color-secondary- in @theme
css = css.replace("--color-blue-", "--color-secondary-")
css = css.replace("--theme-blue-", "--theme-secondary-")

with open("src/index.css", "w") as f:
    f.write(css)

