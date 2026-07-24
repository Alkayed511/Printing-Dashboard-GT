sed -i '353,365c\
  } else {\
    if (!filename || !printer) {\
      return res.status(400).json({ error: '\''Filename and printer are required for real files'\'' });\
    }\
  }\
' server.ts
