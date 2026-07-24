import re
with open("src/components/Navbar.tsx", "r") as f:
    text = f.read()

# Replace unacknowledgedJobs mapping with all jobs mapping in notification dropdown
old_dropdown_list = """                <div className="max-h-64 overflow-y-auto scrollbar-thin p-1">
                  {unacknowledgedJobs.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">لا توجد إشعارات جديدة</div>
                  ) : (
                    unacknowledgedJobs.map(job => (
                      <div key={job.id} className="flex flex-col gap-1 p-2 hover:bg-zinc-800/50 rounded-md border-b border-zinc-800/50 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-200 dir-ltr text-right truncate" title={job.filename}>
                            {job.filename}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDismissNotification) onDismissNotification(job.id);
                            }}
                            className="text-zinc-500 hover:text-rose-400 p-0.5 rounded-full hover:bg-zinc-800 transition-colors"
                            title="حذف الإشعار"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-1"> 
                          <span className="text-[10px] text-zinc-400">الطابعة: <strong className="text-orange-300 font-mono">{job.printer.toUpperCase()}</strong></span>
                          <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-300">{new Date(job.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>"""

new_dropdown_list = """                <div className="max-h-64 overflow-y-auto scrollbar-thin p-1">
                  {recentJobs && recentJobs.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">لا توجد إشعارات سابقة</div>
                  ) : (
                    recentJobs?.map(job => {
                      const isUnread = unacknowledgedJobs.some(uj => uj.id === job.id);
                      return (
                        <div key={job.id} className={`flex flex-col gap-1 p-2 hover:bg-zinc-800/50 rounded-md border-b border-zinc-800/50 last:border-0 ${isUnread ? 'bg-zinc-800/80 border-l-2 border-l-amber-400' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-200 dir-ltr text-right truncate" title={job.filename}>
                              {job.filename}
                            </span>
                            {isUnread && (
                                <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0"></span>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1"> 
                            <span className="text-[10px] text-zinc-400">الطابعة: <strong className="text-orange-300 font-mono">{job.printer.toUpperCase()}</strong></span>
                            <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-300">{new Date(job.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>"""

text = text.replace(old_dropdown_list, new_dropdown_list)

# Add recentJobs to props
text = text.replace("unacknowledgedJobs: PrintJob[];", "unacknowledgedJobs: PrintJob[];\n  recentJobs?: PrintJob[];")
text = text.replace("  unacknowledgedJobs,", "  unacknowledgedJobs,\n  recentJobs,")

with open("src/components/Navbar.tsx", "w") as f:
    f.write(text)
