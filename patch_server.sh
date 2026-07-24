sed -i '191,247c\
    const realJobs = scanDateDirectory(dateDir);\
' server.ts
