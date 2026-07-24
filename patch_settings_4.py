import re
with open("src/components/SettingsTab.tsx", "r") as f:
    text = f.read()

old_effect = """  useEffect(() => {
    setBasePath(config.basePath);
    setCurrentDate(config.currentDate);
    setAutoRefreshInterval(config.autoRefreshInterval);
    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);
    setDisableMouseInDisplayMode(config.disableMouseInDisplayMode || false);
    setThemeColor(config.themeColor || 'orange');
    setSecondaryColor(config.secondaryColor || 'blue');
  }, [config]);"""

new_effect = """  useEffect(() => {
    setBasePath(config.basePath);
    setCurrentDate(config.currentDate);
    setAutoRefreshInterval(config.autoRefreshInterval);
    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);
    setDisableMouseInDisplayMode(config.disableMouseInDisplayMode || false);
    setThemeColor(config.themeColor || 'orange');
    setSecondaryColor(config.secondaryColor || 'blue');
  }, [config]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('primary-orange', 'primary-blue', 'primary-green', 'primary-purple', 'primary-rose');
    root.classList.remove('secondary-orange', 'secondary-blue', 'secondary-green', 'secondary-purple', 'secondary-rose');
    root.classList.add(`primary-${themeColor || 'orange'}`);
    root.classList.add(`secondary-${secondaryColor || 'blue'}`);
  }, [themeColor, secondaryColor]);"""

text = text.replace(old_effect, new_effect)
with open("src/components/SettingsTab.tsx", "w") as f:
    f.write(text)
