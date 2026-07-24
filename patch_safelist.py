with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace("export default function App() {", "// Safelist for dynamic themes: primary-orange primary-blue primary-green primary-purple primary-rose secondary-orange secondary-blue secondary-green secondary-purple secondary-rose\nexport default function App() {")

with open("src/App.tsx", "w") as f:
    f.write(text)
