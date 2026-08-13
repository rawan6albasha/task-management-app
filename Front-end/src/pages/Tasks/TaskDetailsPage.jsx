import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import api from "../../lib/axios";
import {
  fetchTaskById,
  updateTask,
  clearCurrentTask,
  createTask,
  updateTaskStatus,
  approveTask,
} from "../../store/slices/taskSlice";
import { fetchUserById } from "../../store/slices/userSlice";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckSquare,
  User,
  Paperclip,
  MessageSquare,
  Clock,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus,
  Copy,
  XCircle,
  MapPin,
  Building2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "../../components/shared/Button";
import Badge from "../../components/shared/Badge";
import Modal from "../../components/shared/Modal";
import toast from "react-hot-toast";
import { getLocalizedField } from "../../utils/helpers";
import TaskForm from "../../components/tasks/TaskForm";
import TaskStatusSelector from "../../components/tasks/TaskStatusSelector";
import ImportTasksModal from "../../components/projects/ImportTasksModal";
import UserAvatar from "../../components/shared/UserAvatar";
import usePermission from "../../hooks/usePermissions";

export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { can } = usePermission();
  const authState = useSelector((state) => state.auth);
  const currentUser = authState?.user || null;

  const { currentTask, loading } = useSelector((state) => state.tasks);
  const { positions } = useSelector((state) => state.settings);

  // States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [subTaskModalOpen, setSubTaskModalOpen] = useState(false);
  const [parentTaskIdForSub, setParentTaskIdForSub] = useState(null);
  const [importTasksModalOpen, setImportTasksModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [subTaskParentData, setSubTaskParentData] = useState(null);
  const [approverData, setApproverData] = useState(null);
  const [approverLoading, setApproverLoading] = useState(false);
  
  // States for collapsible sections
  const [showSubTasks, setShowSubTasks] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showDescription, setShowDescription] = useState(true);

  // Load Task
  useEffect(() => {
    if (!id) return;
    const loadTask = async () => {
      try {
        const result = await dispatch(fetchTaskById(id)).unwrap();
        setCurrentProjectId(result?.project_id || null);
      } catch (error) {
        if (error?.status === 404) { toast.error(t("task.notFound")); navigate("/tasks", { replace: true }); }
        else if (error?.status === 403) { toast.error(t("common.accessDenied")); navigate("/tasks", { replace: true }); }
        else { toast.error(error.message || t("task.loadFailed")); }
      }
    };
    loadTask();
    return () => { dispatch(clearCurrentTask()); };
  }, [id, dispatch, navigate, t]);

  // Load Approver
  useEffect(() => {
    const loadApprover = async () => {
      if (currentTask?.approved_by_id && !currentTask?.approver) {
        setApproverLoading(true);
        try {
          const result = await dispatch(fetchUserById(currentTask.approved_by_id)).unwrap();
          setApproverData(result?.data || result);
        } catch {
          setApproverData({ id: currentTask.approved_by_id, name: `User #${currentTask.approved_by_id}` });
        } finally { setApproverLoading(false); }
      }
    };
    loadApprover();
  }, [currentTask?.approved_by_id, currentTask?.approver, dispatch]);

  // Helpers
  const lang = i18n.language;
  const title = getLocalizedField(currentTask, "title", lang);
  const description = getLocalizedField(currentTask, "description", lang);
  const taskPosition = currentTask?.position || (currentTask?.position_id ? positions.find(p => p.id === currentTask.position_id) : null);

  const priorityConfig = {
    high: { variant: "priority_high", color: "priority-high" },
    medium: { variant: "priority_medium", color: "priority-medium" },
    low: { variant: "priority_low", color: "priority-low" },
  };
  const currentPriority = priorityConfig[currentTask?.priority] || priorityConfig.medium;

  // Actions
  const handleStatusChange = async (taskId, newStatus) => {
    if (!taskId) { toast.error("❌ Task not found"); return; }
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
      await dispatch(fetchTaskById(taskId));
      toast.success(t("task.statusUpdated"));
    } catch (error) { toast.error(error.message || t("task.updateFailed")); }
  };

  const handleAddSubTask = () => {
    setParentTaskIdForSub(currentTask.id);
    setSubTaskParentData({
      project_id: currentTask.project_id, branch_id: currentTask.branch_id,
      section_id: currentTask.section_id, priority: currentTask.priority, task_status: "pending",
    });
    setSubTaskModalOpen(true);
  };

  const handleSaveSubTask = async (taskData) => {
    try {
      await dispatch(createTask({ ...taskData, parent_id: parentTaskIdForSub || currentTask?.id })).unwrap();
      setSubTaskModalOpen(false); setParentTaskIdForSub(null);
      await dispatch(fetchTaskById(id));
      toast.success(t("task.subTaskCreated"));
    } catch (error) { toast.error(error.message || t("task.subTaskCreateFailed")); }
  };

  const handleApproval = async (status) => {
    try {
      await dispatch(approveTask({ taskId: currentTask.id, status, refusalReason: status === "rejected" ? refusalReason : undefined })).unwrap();
      toast.success(status === "confirmed" ? t("task.approvedSuccessfully") : t("task.rejectedSuccessfully"));
      setApprovalModalOpen(false); setRefusalReason("");
      await dispatch(fetchTaskById(id));
    } catch (error) { toast.error(error.message || t("task.approvalFailed")); }
  };

  const handleTaskUpdate = async (formData) => {
    try {
      await dispatch(updateTask({ taskId: currentTask.id, ...formData })).unwrap();
      toast.success(t("task.updatedSuccessfully")); setEditModalOpen(false);
      await dispatch(fetchTaskById(id));
    } catch (error) { toast.error(error.message || t("task.updateFailed")); }
  };

  const handleViewFile = async (file) => {
    try {
      const response = await api.get(`/api/files/view/${file.id}`, { responseType: "blob" });
      const blob = response instanceof Blob ? response : response.data;
      if (blob.type?.includes("application/json")) throw new Error("Error viewing file");
      const url = window.URL.createObjectURL(blob); window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch { toast.error(t("task.failedToViewFile")); }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await api.get(`/api/files/download/${file.id}`, { responseType: "blob" });
      const blob = response instanceof Blob ? response : response.data;
      if (blob.type?.includes("application/json")) throw new Error("Error downloading file");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = file.name || "download";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch { toast.error(t("task.failedToDownloadFile")); }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm(t("task.confirmDeleteFile"))) return;
    try {
      await api.delete(`/api/files/delete/${fileId}`);
      toast.success(t("task.fileUnlinkedSuccess"));
      await dispatch(fetchTaskById(id));
    } catch { toast.error(t("task.fileDeleteFailed")); }
  };

  const handleImportTasks = async (tasksToImport) => {
    try {
      for (const task of tasksToImport) {
        await dispatch(createTask({
          ...task, project_id: parseInt(currentTask?.project_id || currentProjectId),
          parent_id: currentTask?.id, task_status: "pending", status: "pending", status_approval: "pending",
          id: undefined, created_at: undefined, updated_at: undefined, project: undefined, assigned_user: undefined
        }));
      }
      toast.success(t("task.tasksImportedSuccessfully")); setImportTasksModalOpen(false);
      await dispatch(fetchTaskById(id));
    } catch { toast.error(t("task.failedToImportTasks")); }
  };

  // Loading / Not Found States
  if (loading && !currentTask) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!currentTask && !loading) return <div className="text-center py-20"><p className="text-text-muted">{t("task.notFound")}</p><Button onClick={() => navigate("/tasks")} className="mt-4">{t("common.back")}</Button></div>;

  // ✅ START RETURN
// ✅ START RETURN - التصميم النهائي (سايدبار موحد)
return (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Header */}
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")} className="h-9 px-2.5 rounded-lg hover:bg-background/80">
          <ArrowLeft size={18} className="ms-1" />
          <span className="hidden sm:inline text-sm font-medium">{t("common.back")}</span>
        </Button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-bold text-text truncate" title={title}>{title}</h1>
          <Badge variant={currentPriority.variant} className="text-[10px] sm:text-xs px-2 py-0.5 shrink-0">
            {t(`priority.${currentTask.priority}`)}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {currentUser?.id === currentTask?.created_by_id && (
          <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)} className="h-9 px-3 text-xs rounded-lg hidden sm:inline-flex">
            <Edit size={14} className="ms-1" /> 
            <span>{t("common.edit")}</span>
          </Button>
        )}
        <TaskStatusSelector task={currentTask} taskId={currentTask?.id} onStatusChange={handleStatusChange} size="small" />
      </div>
    </header>

    {/* Main Layout */}
    <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-y-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ✅ Sidebar: موحد بكرت واحد */}
        <aside className="lg:col-span-4">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-4 space-y-4">
            
            {/* 1. Assigned To */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <User size={14} className="text-primary" /> {t("task.assignedTo")}
              </h3>
              <div className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                <UserAvatar user={currentTask.assigned_user} size="lg" showBorder={true} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text truncate">{currentTask.assigned_user?.name || t("common.notAssigned")}</p>
                  {currentTask.assigned_user?.position && (
                    <p className="text-[10px] text-text-muted truncate">
                      {lang === 'ar' ? (currentTask.assigned_user.position.ar_name || currentTask.assigned_user.position.en_name) : (currentTask.assigned_user.position.en_name || currentTask.assigned_user.position.ar_name)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border/50"></div>

            {/* 2. Project & Organization */}
            {currentTask.project && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={14} /> {t("task.project")}
                </h3>
                <div className="space-y-1.5">
                  <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-medium text-text truncate">{getLocalizedField(currentTask.project, "name", lang)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Building2 size={12} />
                    <span className="truncate">
                      {lang === 'ar' ? (currentTask.branch?.ar_name || currentTask.branch?.en_name) : (currentTask.branch?.en_name || currentTask.branch?.ar_name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <FolderKanban size={12} />
                    <span className="truncate">
                      {lang === 'ar' ? (currentTask.section?.ar_name || currentTask.section?.en_name) : (currentTask.section?.en_name || currentTask.section?.ar_name)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-border/50"></div>

            {/* 3. Amount & Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} /> {t("task.budgetAndTimeline")}
              </h3>
              
              <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{t("task.amount")}</p>
                <p className="text-2xl font-black text-primary">${parseFloat(currentTask.amount || 0).toFixed(2)}</p>
              </div>
              
              <div className="space-y-2">
                {currentTask.start_date && (
                  <div className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg">
                    <span className="text-text-muted">{t("task.startDate")}</span>
                    <span className="font-medium">{new Date(currentTask.start_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {month:'short', day:'numeric'})}</span>
                  </div>
                )}
                {currentTask.due_date && (
                  <div className="flex items-center justify-between text-xs p-2 bg-warning/5 rounded-lg border border-warning/20">
                    <span className="text-text-muted">{t("task.dueDate")}</span>
                    <span className="font-semibold text-warning">{new Date(currentTask.due_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {month:'short', day:'numeric'})}</span>
                  </div>
                )}
                {currentTask.end_date && (
                  <div className="flex items-center justify-between text-xs p-2 bg-success/5 rounded-lg border border-success/20">
                    <span className="text-text-muted">{t("task.endDate")}</span>
                    <span className="font-semibold text-success">{new Date(currentTask.end_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {month:'short', day:'numeric'})}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border/50"></div>

            {/* 4. Approval Section */}
            {currentTask.needs_approval === 1 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={14} /> {t("task.approval")}
                </h3>
                <Badge variant={currentTask.status_approval === "confirmed" ? "status_completed" : currentTask.status_approval === "rejected" ? "status_canceled" : "status_pending"} className="text-xs px-3 py-1.5 w-full text-center">
                  {t(`task.approvalStatus.${currentTask.status_approval}`)}
                </Badge>
                
                {currentUser?.id === currentTask.approved_by_id && currentTask.status_approval === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handleApproval("confirmed")} className="flex-1">
                      <CheckSquare size={14} className="ms-1" /> {t("task.approve")}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setApprovalModalOpen(true)} className="flex-1">
                      <XCircle size={14} className="ms-1" /> {t("task.reject")}
                    </Button>
                  </div>
                )}
                
                {currentTask.status_approval === "rejected" && currentTask.refusal_reason && (
                  <div className="p-2 bg-danger/5 border border-danger/20 rounded-lg">
                    <p className="text-[10px] font-medium text-danger mb-1">{t("task.refusalReason")}:</p>
                    <p className="text-xs text-text">{currentTask.refusal_reason}</p>
                  </div>
                )}
                
                {approverData && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <UserAvatar user={approverData} size="xs" className="w-5 h-5" />
                    <span className="text-xs text-text-muted truncate">{approverData.name || `User #${currentTask.approved_by_id}`}</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border/50"></div>

            {/* 5. Created By */}
            {currentTask.creator && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t("task.createdBy")}</h3>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <UserAvatar user={currentTask.creator} size="sm" showBorder={true} className="w-7 h-7" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{currentTask.creator.name}</p>
                    {currentTask.creator.position && (
                      <p className="text-[10px] text-text-muted truncate">
                        {lang === 'ar' ? (currentTask.creator.position.ar_name || currentTask.creator.position.en_name) : (currentTask.creator.position.en_name || currentTask.creator.position.ar_name)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ✅ Main Content: الوصف، المهام الفرعية، المرفقات */}
        <section className="lg:col-span-8 space-y-4">
          
          {/* Description */}
          {description && (
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" /> {t("task.description")}
                </h3>
                <button onClick={() => setShowDescription(!showDescription)} className="text-text-muted hover:text-primary transition-colors p-1 rounded">
                  {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {showDescription && (
                <div className="text-sm text-text leading-relaxed ql-editor prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                </div>
              )}
            </div>
          )}

          {/* Sub-Tasks */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <CheckSquare size={16} className="text-primary" /> {t("task.subTasks")}
                {currentTask.sub_task?.length > 0 && <Badge variant="default" className="text-xs px-2 py-0.5">{currentTask.sub_task.length}</Badge>}
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleAddSubTask}>
                  <Plus size={14} className="ms-1" /> <span className="hidden sm:inline">{t("task.addSubTask")}</span>
                  <span className="sm:hidden">{t("common.add")}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportTasksModalOpen(true)}>
                  <Copy size={14} className="ms-1" /> <span className="hidden sm:inline">{t("task.import")}</span>
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {currentTask.sub_task?.length > 0 ? (
                currentTask.sub_task.map((subTask) => (
                  <div key={subTask.id} onClick={() => navigate(`/tasks/${subTask.id}`)} className="group p-3 bg-background/50 rounded-lg hover:bg-background border border-transparent hover:border-primary/20 cursor-pointer transition-all flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">{getLocalizedField(subTask, 'title', lang)}</span>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ms-2 ${subTask.task_status === 'completed' ? 'bg-success' : subTask.task_status === 'in_progress' ? 'bg-primary' : 'bg-warning'}`}></span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted text-sm">
                  <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
                  <p>{t("task.noSubTasks")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Paperclip size={16} className="text-primary" /> {t("task.attachments")}
                {currentTask.files?.length > 0 && <Badge variant="default" className="text-xs px-2 py-0.5">{currentTask.files.length}</Badge>}
              </h3>
              <button onClick={() => setShowFiles(!showFiles)} className="text-text-muted hover:text-primary transition-colors p-1 rounded">
                {showFiles ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {showFiles && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentTask.files?.length > 0 ? (
                  currentTask.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-border transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Paperclip size={16} className="text-text-muted shrink-0" />
                        <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleViewFile(file)} className="p-1.5 rounded hover:bg-primary/10 text-text-muted hover:text-primary transition-colors" title={t("common.view")}><Eye size={13} /></button>
                        <button onClick={() => handleDownloadFile(file)} className="p-1.5 rounded hover:bg-primary/10 text-text-muted hover:text-primary transition-colors" title={t("common.download")}><Download size={13} /></button>
                        <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors" title={t("common.delete")}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-text-muted text-sm">
                    <Paperclip size={24} className="mx-auto mb-2 opacity-30" />
                    <p>{t("task.noAttachments")}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </section>
      </div>
    </main>

    {/* Modals - لم يتم تغييرها */}
    {editModalOpen && <TaskForm key={currentTask?.id || "edit-task"} isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} task={currentTask} onSubmit={handleTaskUpdate} defaultProjectId={currentTask?.project_id} parentTaskId={currentTask?.parent_id} />}
    {subTaskModalOpen && <TaskForm isOpen={subTaskModalOpen} onClose={() => { setSubTaskModalOpen(false); setParentTaskIdForSub(null); setSubTaskParentData(null); }} task={null} onSubmit={handleSaveSubTask} parentTaskId={parentTaskIdForSub} defaultProjectId={subTaskParentData?.project_id} defaultBranchId={subTaskParentData?.branch_id} defaultSectionId={subTaskParentData?.section_id} defaultPriority={subTaskParentData?.priority} defaultStatus={subTaskParentData?.task_status} />}
    <ImportTasksModal isOpen={importTasksModalOpen} onClose={() => setImportTasksModalOpen(false)} currentProjectId={currentTask.project_id} currentParentTaskId={currentTask.id} mode="from-task" onImport={handleImportTasks} />
    {approvalModalOpen && <Modal isOpen={approvalModalOpen} onClose={() => { setApprovalModalOpen(false); setRefusalReason(""); }} title={t("task.rejectReason")} footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setApprovalModalOpen(false); setRefusalReason(""); }} disabled={approvalLoading}>{t("common.cancel")}</Button><Button variant="danger" onClick={() => handleApproval("rejected")} loading={approvalLoading} disabled={approvalLoading || !refusalReason.trim()}>{t("task.confirmReject")}</Button></div>}><textarea value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)} placeholder={t("task.rejectReasonPlaceholder")} className="w-full border border-border rounded-lg px-3 py-2 text-sm" disabled={approvalLoading} /></Modal>}
  </div>
);
// ✅ END RETURN
  // ✅ END RETURN
}