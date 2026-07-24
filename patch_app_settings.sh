sed -i 's/import { NetworkConfigModal } from '\''.\/components\/NetworkConfigModal'\'';/import { SettingsTab } from '\''.\/components\/SettingsTab'\'';/g' src/App.tsx
sed -i '/<NetworkConfigModal/,/\\/>/d' src/App.tsx
sed -i '/{activeTab === '\''stats'\'' && (/i\        {activeTab === '\''settings'\'' && (\n          <div className="flex-1 overflow-y-auto scrollbar-thin">\n            <SettingsTab config={config} onSaveConfig={handleSaveConfig} />\n          </div>\n        )}\n' src/App.tsx
