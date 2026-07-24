sed -i '420c\
  filtered = filtered.filter(j => j.status === '\''done'\'');\
' server.ts
sed -i '517c\
  filtered = filtered.filter(j => j.status === '\''done'\'');\
' server.ts
