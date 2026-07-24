with open("src/types.ts", "r") as f:
    text = f.read()

old_config = """export interface ServerConfig {
  basePath: string;
  currentDate: string;
  autoRefreshInterval: number; // in seconds, 0 = off
  isRealStorageAvailable: boolean;
  activePath: string;
  notificationSound?: string;
  notificationColor?: string;
  notificationDuration?: number;
}"""

new_config = """export interface ServerConfig {
  basePath: string;
  currentDate: string;
  autoRefreshInterval: number; // in seconds, 0 = off
  isRealStorageAvailable: boolean;
  activePath: string;
  notificationSound?: string;
  notificationColor?: string;
  notificationDuration?: number;
  disableMouseInDisplayMode?: boolean;
  themeColor?: string;
}"""

text = text.replace(old_config, new_config)
with open("src/types.ts", "w") as f:
    f.write(text)
