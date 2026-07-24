sed -i '223,243c\
          {/* Alert Notification Dropdown */}\
          <div className="relative">\
            <button\
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}\
              className={`relative p-1.5 rounded-md border transition-all shrink-0 ${\
                unacknowledgedCount > 0\
                  ? '\''bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-md animate-pulse'\''\
                  : '\''bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'\''\
              }`}\
              title={unacknowledgedCount > 0 ? `تنبيه: ${unacknowledgedCount} طلب جديد` : '\''لا توجد تنبيهات جديدة'\''}\
            >\
              {unacknowledgedCount > 0 ? (\
                <BellRing className="w-3.5 h-3.5 text-white" />\
              ) : (\
                <Bell className="w-3.5 h-3.5 text-zinc-400" />\
              )}\
              {unacknowledgedCount > 0 && (\
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-yellow-300 text-red-950 text-[10px] font-black rounded-full flex items-center justify-center border border-red-700 shadow font-mono">\
                  {unacknowledgedCount}\
                </span>\
              )}\
            </button>\
\
            {isNotificationsOpen && (\
              <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden">\
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-800">\
                  <h3 className="font-bold text-xs text-zinc-200">الإشعارات ({unacknowledgedCount})</h3>\
                  {unacknowledgedCount > 0 && (\
                    <button \
                      onClick={() => {\
                        if (onDismissAllNotifications) onDismissAllNotifications();\
                        else if (onAcknowledgeAlert) onAcknowledgeAlert();\
                        setIsNotificationsOpen(false);\
                      }}\
                      className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"\
                    >\
                      تحديد الكل كمقروء\
                    </button>\
                  )}\
                </div>\
                <div className="max-h-64 overflow-y-auto scrollbar-thin p-1">\
                  {unacknowledgedJobs.length === 0 ? (\
                    <div className="p-4 text-center text-zinc-500 text-xs">لا توجد إشعارات جديدة</div>\
                  ) : (\
                    unacknowledgedJobs.map(job => (\
                      <div key={job.id} className="flex flex-col gap-1 p-2 hover:bg-zinc-800/50 rounded-md border-b border-zinc-800/50 last:border-0">\
                        <div className="flex items-start justify-between gap-2">\
                          <span className="text-xs font-bold text-zinc-200 dir-ltr text-right truncate" title={job.filename}>\
                            {job.filename}\
                          </span>\
                          <button \
                            onClick={(e) => {\
                              e.stopPropagation();\
                              if (onDismissNotification) onDismissNotification(job.id);\
                            }}\
                            className="text-zinc-500 hover:text-rose-400 p-0.5 rounded-full hover:bg-zinc-800 transition-colors"\
                            title="حذف الإشعار"\
                          >\
                            <X className="w-3.5 h-3.5" />\
                          </button>\
                        </div>\
                        <div className="flex justify-between items-center mt-1">\
                           <span className="text-[10px] text-zinc-400">الطابعة: <strong className="text-orange-300 font-mono">{job.printer.toUpperCase()}</strong></span>\
                           <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-300">{new Date(job.createdAt).toLocaleTimeString('\''ar-SA'\'', { hour: '\''2-digit'\'', minute: '\''2-digit'\'' })}</span>\
                        </div>\
                      </div>\
                    ))\
                  )}\
                </div>\
              </div>\
            )}\
          </div>\
' src/components/Navbar.tsx
