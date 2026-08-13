// src/components/projects/ImportTasksModal.jsx
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUsers } from "../../store/slices/userSlice";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Badge from "../shared/Badge";
import { getLocalizedField } from "../../utils/helpers";
import { Search, Edit2, ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import toast from "react-hot-toast";

export default function ImportTasksModal({ 
  isOpen, onClose, currentProjectId, currentParentTaskId,
  mode = "from-project", onImport, projects: parentProjects
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  
  const projectState = useSelector((state) => state.project);
  const reduxProjects = projectState?.projects || [];
  const { tasks } = useSelector((state) => state.tasks);
  const { allUsers: usersList } = useSelector((state) => state.users || { allUsers: { 'active users': [], 'deactive users': [] } });
  const currentUser = useSelector((state) => state.auth?.user);
  
  const availableProjects = useMemo(() => {
    if (parentProjects && Array.isArray(parentProjects) && parentProjects.length > 0) return parentProjects;
    if (Array.isArray(reduxProjects) && reduxProjects.length > 0) return reduxProjects;
    return [];
  }, [parentProjects, reduxProjects]);
  
  const [targetProjectId, setTargetProjectId] = useState(currentProjectId || "");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedSubtasks, setSelectedSubtasks] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [importMode, setImportMode] = useState("manual");
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  const [editableFields, setEditableFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [userFilters, setUserFilters] = useState({ branch_id: "", section_id: "", position_id: "" });
const organizeTasksByParent = (tasks) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return {};
  
  const organized = {};
  
  // أولاً: نهيكل كل المهام في كائن حسب الـ ID
  tasks.forEach(task => {
    if (task?.id) {
      organized[task.id] = {
        ...task,
        _subtasks: [] // مصفوفة داخلية لتخزين المهام الفرعية
      };
    }
  });
  
  // ثانياً: نوزع المهام الفرعية على الآباء بناءً على parent_id
  tasks.forEach(task => {
    // إذا كانت المهمة لها parent_id وهذا الأب موجود في القائمة
    if (task?.parent_id && organized[task.parent_id]) {
      organized[task.parent_id]._subtasks.push(organized[task.id]);
    }
  });
  
  return organized;
};
// ✅ ننظم المهام حسب العلاقة (يعاد الحساب فقط عند تغير المهام)
const organizedTasks = useMemo(() => {
  return organizeTasksByParent(tasks);
}, [tasks]);

  // ✅ دالة جلب المهام الفرعية - تدعم اسم الحقل الصحيح من الـ API
// ✅ دالة جلب المهام الفرعية لمهمة معينة (باستخدام parent_id)
const getSubtasks = (task) => {
  if (!task?.id) return [];
  return organizedTasks[task.id]?._subtasks || [];
};

  const otherProjects = useMemo(() => {
    if (!Array.isArray(availableProjects) || availableProjects.length === 0) return [];
    const currentId = currentProjectId ? parseInt(currentProjectId) : null;
    return availableProjects.filter(p => p && p.id).filter(p => currentId ? p.id !== currentId : true);
  }, [availableProjects, currentProjectId]);

  const sourceTasks = useMemo(() => {
    if (!selectedProject || !selectedProject.id) return [];
    if (!Array.isArray(tasks)) return [];
    let projectTasks = tasks.filter(task => task && task.project_id === selectedProject.id);
    if (showOnlyMyTasks && currentUser?.id) {
      projectTasks = projectTasks.filter(t => t?.created_by_id === currentUser.id);
    }
    if (mode === "from-task") {
      return projectTasks.filter(t => getSubtasks(t).length > 0);
    }
    return projectTasks;
  }, [mode, selectedProject, tasks, showOnlyMyTasks, currentUser]);

// const sourceTasks = useMemo(() => {
//   if (!selectedProject || !selectedProject.id) return [];
//   if (!Array.isArray(tasks)) return [];
  
//   let projectTasks = tasks.filter(task => 
//     task && task.project_id === selectedProject.id
//   );
  
//   // ✅ فلتر: اعرض فقط المهام الرئيسية (الآباء)
//   // إذا بدك تعرض الكل، احذف هذا الشرط
//   if (mode === "from-project") {
//     projectTasks = projectTasks.filter(t => !t.parent_id || t.parent_id === null);
//   }
  
//   if (showOnlyMyTasks && currentUser?.id) {
//     projectTasks = projectTasks.filter(t => t?.created_by_id === currentUser.id);
//   }
  
//   return projectTasks;
// }, [mode, selectedProject, tasks, showOnlyMyTasks, currentUser]);


  const activeUsers = useMemo(() => usersList?.['active users'] || [], [usersList]);
  
  const getFilteredUsers = () => {
    let users = activeUsers;
    if (userFilters.branch_id) users = users.filter(u => u?.branch_id === Number(userFilters.branch_id));
    if (userFilters.section_id) users = users.filter(u => u?.section_id === Number(userFilters.section_id));
    if (userFilters.position_id) users = users.filter(u => u?.position_id === Number(userFilters.position_id));
    return users;
  };

  const branches = useMemo(() => [...new Set(activeUsers.map(u => u?.branch_id).filter(Boolean))], [activeUsers]);
  const sections = useMemo(() => [...new Set(activeUsers.map(u => u?.section_id).filter(Boolean))], [activeUsers]);
  const positions = useMemo(() => [...new Set(activeUsers.map(u => u?.position_id).filter(Boolean))], [activeUsers]);

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(sourceTasks)) return [];
    return sourceTasks.filter(task => {
      if (!task) return false;
      const name = getLocalizedField(task, 'title', i18n.language)?.toLowerCase() || '';
      const desc = getLocalizedField(task, 'description', i18n.language)?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
    });
  }, [sourceTasks, searchQuery, i18n.language]);


  useEffect(() => { 
    if (isOpen) dispatch(fetchAllUsers()); 
   }, [isOpen, dispatch]);
  //  console.log('task:',tasks)

  const handleTaskToggle = (taskId, withSubtasks = false) => {
    const newSelected = new Set(selectedTasks);
    const newSelectedSubtasks = { ...selectedSubtasks };
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
      delete newSelectedSubtasks[taskId];
      const newEditable = { ...editableFields };
      const newEdited = { ...editedValues };
      delete newEditable[taskId];
      delete newEdited[taskId];
      setEditableFields(newEditable);
      setEditedValues(newEdited);
    } else {
      newSelected.add(taskId);
      if (withSubtasks) {
        const task = sourceTasks.find(t => t?.id === taskId);
        if (task) {
          const subs = getSubtasks(task);
          newSelectedSubtasks[taskId] = new Set(subs.map(s => s?.id).filter(Boolean));
        }
      }
    }
    setSelectedTasks(newSelected);
    setSelectedSubtasks(newSelectedSubtasks);
  };

  const handleSubtaskToggle = (parentId, subtaskId) => {
    const current = selectedSubtasks[parentId] || new Set();
    const newSet = new Set(current);
    if (newSet.has(subtaskId)) newSet.delete(subtaskId);
    else newSet.add(subtaskId);
    setSelectedSubtasks(prev => ({ ...prev, [parentId]: newSet }));
  };

  const toggleExpand = (taskId) => setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  const toggleFieldEdit = (taskId, fieldName) => {
    setEditableFields(prev => ({ ...prev, [taskId]: { ...prev[taskId], [fieldName]: !prev[taskId]?.[fieldName] } }));
  };

  const updateEditedValue = (taskId, fieldName, value) => {
    setEditedValues(prev => ({ ...prev, [taskId]: { ...prev[taskId], [fieldName]: value } }));
  };

  const prepareImportedTasks = () => {
    const result = [];
    selectedTasks.forEach(taskId => {
      const task = sourceTasks.find(t => t?.id === taskId);
      if (!task) return;
      const edits = editedValues[taskId] || {};
      const isEditable = editableFields[taskId] || {};
      
      const mainTask = {
        ...task,
        project_id: targetProjectId ? parseInt(targetProjectId) : parseInt(task.project_id),
        task_status: isEditable.status ? edits.status : 'pending',
        status: isEditable.status ? edits.status : 'pending',
        priority: isEditable.priority ? edits.priority : task.priority,
        assigned_id: isEditable.assigned_id ? (edits.assigned_id ?? task.assigned_id) : task.assigned_id,
        due_date: isEditable.due_date ? edits.due_date : task.due_date,
        amount: isEditable.amount ? edits.amount : task.amount,
        needs_approval: isEditable.needs_approval ? edits.needs_approval : task.needs_approval,
        title_ar: isEditable.title_ar ? edits.title_ar : task.title_ar,
        title_en: isEditable.title_en ? edits.title_en : task.title_en,
        description_ar: isEditable.description_ar ? edits.description_ar : task.description_ar,
        description_en: isEditable.description_en ? edits.description_en : task.description_en,
        parent_id: mode === "from-task" ? currentParentTaskId : task.parent_id,
        id: undefined, created_at: undefined, updated_at: undefined, project: undefined,
        subtasks: undefined, sub_task: undefined,
        assigned_user: isEditable.assigned_id ? undefined : task.assigned_user,
      };
      result.push(mainTask);
      
if (mode === "from-project" && selectedSubtasks[taskId]) {
  const subtasksToImport = getSubtasks(task); // ✅ تجيب المهام الفرعية من التنظيم
  
  subtasksToImport.forEach(sub => {
    if (selectedSubtasks[taskId]?.has(sub?.id)) {
      result.push({
        ...sub,
        task_status: 'pending',
        status: 'pending',
        project_id: targetProjectId ? parseInt(targetProjectId) : parseInt(task.project_id),
        parent_id: mainTask.id, // ✅ نربط الـ subtask بالمهمة الرئيسية الجديدة
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        project: undefined,
        assigned_user: undefined,
      });
    }
  });
}
    });
    return result;
  };

  const handleImport = () => {
    if (!targetProjectId) { toast.error(t("task.selectTargetProjectFirst")); return; }
    if (importMode === "all") {
      const tasksToImport = sourceTasks.filter(t => t?.id).map(task => ({
        ...task, task_status: 'pending', status: 'pending',
        project_id: parseInt(targetProjectId),
        parent_id: mode === "from-task" ? currentParentTaskId : task.parent_id,
        id: undefined, created_at: undefined, updated_at: undefined, project: undefined,
        subtasks: undefined, sub_task: undefined,
      }));
      onImport(tasksToImport, targetProjectId);
    } else {
      if (selectedTasks.size === 0) { toast.error(t("task.selectAtLeastOneTask")); return; }
      const prepared = prepareImportedTasks();
      onImport(prepared, targetProjectId);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedProject(null); setSelectedTasks(new Set()); setSelectedSubtasks({});
    setExpandedTasks({}); setSearchQuery(""); setImportMode("manual"); setShowOnlyMyTasks(false);
    setEditableFields({}); setEditedValues({});
    setUserFilters({ branch_id: "", section_id: "", position_id: "" });
    onClose();
  };

  const isAllSelected = selectedTasks.size === filteredTasks.length && filteredTasks.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("task.importFromProject")} size="xl" footer={
      <>
        <Button variant="ghost" onClick={handleClose}>{t("common.cancel")}</Button>
        <Button onClick={handleImport} disabled={!selectedProject?.id || (importMode === "manual" && selectedTasks.size === 0)}>
          {t("task.importTasks")}
        </Button>
      </>
    }>
      <div className="space-y-5 overflow-x-hidden">
        
        {/* Mode Info */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
          <FolderTree size={18} className="text-primary" />
          <p className="text-sm text-text">{mode === "from-project" ? t("task.importFromProjectDesc") : t("task.importSubtasksDesc")}</p>
        </div>

        {/* Target Project Selection */}
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
          <label className="block text-sm font-bold mb-2 text-primary">
            {t("task.targetProject")} *
            <span className="text-xs text-text-muted block font-normal">{t("task.selectTargetProjectDesc")}</span>
          </label>
          <select value={targetProjectId} onChange={(e) => setTargetProjectId(e.target.value ? parseInt(e.target.value) : "")} className="w-full border-2 border-primary/30 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none" required>
            <option value="">{t("task.chooseTargetProject")}</option>
            {Array.isArray(availableProjects) && availableProjects.filter(p => p?.id && p.id !== selectedProject?.id).map(proj => (
             
              <option key={proj.id} value={proj.id}>{getLocalizedField(proj, 'name', i18n.language)}</option>
            ))}
          </select>
          {!targetProjectId && <p className="text-xs text-danger mt-1">⚠️ {t("task.targetProjectRequired")}</p>}
        </div>

        {/* Source Project Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-text">{t("task.selectSourceProject")} *</label>
          <select value={selectedProject?.id || ""} onChange={(e) => {
            const projId = e.target.value ? parseInt(e.target.value) : null;
            const proj = otherProjects.find(p => p?.id === projId) || null;
            setSelectedProject(proj); setSelectedTasks(new Set()); setSelectedSubtasks({});
            setExpandedTasks({}); setSearchQuery(""); setEditableFields({}); setEditedValues({});
          }} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-text focus:ring-2 focus:ring-primary outline-none" disabled={availableProjects?.length === 0}>
            <option value="">{t("task.chooseProject")}</option>
            {Array.isArray(otherProjects) && otherProjects.filter(p => p?.id).map(proj => (
              <option key={proj.id} value={proj.id}>{getLocalizedField(proj, 'name', i18n.language)}</option>
            ))}
          </select>
          {availableProjects?.length === 0 && <p className="text-xs text-text-muted mt-1">{t("project.noProjects")}</p>}
        </div>

        {/* Import Mode */}
        {selectedProject?.id && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">{t("task.importMode")}</label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition">
              <input type="radio" name="mode" value="all" checked={importMode === "all"} onChange={(e) => setImportMode(e.target.value)} className="w-4 h-4" />
              <div><p className="font-medium text-sm text-text">{t("task.importAll")}</p><p className="text-xs text-text-muted">{filteredTasks.length} {t("task.tasks")}</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition">
              <input type="radio" name="mode" value="manual" checked={importMode === "manual"} onChange={(e) => setImportMode(e.target.value)} className="w-4 h-4" />
              <div><p className="font-medium text-sm text-text">{t("task.selectSpecific")}</p><p className="text-xs text-text-muted">{selectedTasks.size} {t("task.selectedTasks")}</p></div>
            </label>
          </div>
        )}

        {/* Task List - Manual Mode */}
        {importMode === "manual" && selectedProject?.id && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input type="text" placeholder={t("common.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full ps-10 pe-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedTasks(isAllSelected ? new Set() : new Set(filteredTasks.map(t => t?.id).filter(Boolean)))}>{isAllSelected ? t("common.clear") : t("common.selectAll")}</Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredTasks.length === 0 ? (
                <p className="text-center py-6 text-text-muted text-sm">{searchQuery ? t("task.noTasksFound") : t("task.noTasks")}</p>
              ) : (
filteredTasks.filter(task => task?.id).map(task => {
  const taskName = getLocalizedField(task, 'title', i18n.language);
  const taskStatus = task?.task_status || task?.status;
  const isSelected = selectedTasks.has(task.id);
  const isExpanded = expandedTasks[task.id];
  
  // ✅ نجيب الـ subtasks باستخدام parent_id
  const hasSubtasks = getSubtasks(task).length > 0;
  const subtasksList = getSubtasks(task);
  const selectedSubCount = selectedSubtasks[task.id]?.size || 0;
                  
                  return (
                    <div key={task.id} className={`border border-border rounded-xl p-3 transition-all ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-surface hover:bg-surface/70'}`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={isSelected} onChange={() => handleTaskToggle(task.id)} className="w-4 h-4 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
      {hasSubtasks && mode === "from-project" && (
        <button onClick={() => toggleExpand(task.id)} className="p-1 hover:bg-surface rounded">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-xs ms-1">{subtasksList.length} subtasks</span>
        </button>
      )}
                            <p className="font-medium text-sm text-text truncate">{taskName}</p>
                            <Badge variant={taskStatus === 'completed' ? 'status-completed' : taskStatus === 'in_progress' ? 'status-in-progress' : taskStatus === 'canceled' ? 'status-canceled' : 'status-pending'} className="text-xs">
                              {t(`status.${taskStatus}`)} → {t('status.pending')}
                            </Badge>
                          </div>
                          
                          {/* Subtasks List */}
      {expandedTasks[task.id] && hasSubtasks && (
        <div className="mt-2 ps-4 border-s border-border bg-surface/50 rounded p-2">
          <p className="text-xs text-text-muted mb-2">Subtasks:</p>
          {subtasksList.map(sub => (
            <div key={sub?.id} className="text-xs py-1 ps-2 border-r-2 border-primary/30">
              <span className="font-medium">{getLocalizedField(sub, 'title', i18n.language)}</span>
              <span className="text-text-muted ms-2">#{sub?.id}</span>
            </div>
          ))}
        </div>
      )}

                          {/* Editable Fields */}
                          {isSelected && mode === "from-project" && (
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <div className="flex items-center gap-2 text-xs text-primary font-bold"><Edit2 size={14} /><span>{t("task.editBeforeImport")}</span></div>
                              
                              {/* Status */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.status")}:</span>
                                {editableFields[task.id]?.status ? (
                                  <select value={editedValues[task.id]?.status || 'pending'} onChange={(e) => updateEditedValue(task.id, 'status', e.target.value)} className="text-xs border rounded px-1 py-0.5 flex-1">
                                    <option value="pending">{t("status.pending")}</option>
                                    <option value="in_progress">{t("status.in_progress")}</option>
                                    <option value="completed">{t("status.completed")}</option>
                                    <option value="canceled">{t("status.canceled")}</option>
                                  </select>
                                ) : <Badge variant="status-pending" className="text-xs flex-1">{t("status.pending")}</Badge>}
                                <button onClick={() => toggleFieldEdit(task.id, 'status')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>

                              {/* Priority */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.priority")}:</span>
                                {editableFields[task.id]?.priority ? (
                                  <select value={editedValues[task.id]?.priority || task.priority} onChange={(e) => updateEditedValue(task.id, 'priority', e.target.value)} className="text-xs border rounded px-1 py-0.5 flex-1">
                                    <option value="low">{t("priority.low")}</option>
                                    <option value="medium">{t("priority.medium")}</option>
                                    <option value="high">{t("priority.high")}</option>
                                  </select>
                                ) : <Badge variant={`priority_${task.priority}`} className="text-xs flex-1">{t(`priority.${task.priority}`)}</Badge>}
                                <button onClick={() => toggleFieldEdit(task.id, 'priority')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>

                              {/* Due Date */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.dueDate")}:</span>
                                {editableFields[task.id]?.due_date ? (
                                  <input type="date" value={editedValues[task.id]?.due_date || task.due_date || ''} onChange={(e) => updateEditedValue(task.id, 'due_date', e.target.value)} className="text-xs border rounded px-1 py-0.5 flex-1" />
                                ) : <span className="text-xs flex-1">{task.due_date || '-'}</span>}
                                <button onClick={() => toggleFieldEdit(task.id, 'due_date')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>

                              {/* Assigned To */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.assignedTo")}:</span>
                                {editableFields[task.id]?.assigned_id ? (
                                  <select value={editedValues[task.id]?.assigned_id ?? task.assigned_id ?? ''} onChange={(e) => updateEditedValue(task.id, 'assigned_id', e.target.value ? parseInt(e.target.value) : null)} className="text-xs border rounded px-1 py-0.5 flex-1">
                                    <option value="">{t("task.unassigned")}</option>
                                    {getFilteredUsers().filter(u => u?.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
                                ) : <span className="text-xs flex-1">{task.assigned_user?.name || t("task.unassigned")}</span>}
                                <button onClick={() => toggleFieldEdit(task.id, 'assigned_id')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>

                              {/* Amount */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.amount")}:</span>
                                {editableFields[task.id]?.amount ? (
                                  <input type="number" step="0.01" value={editedValues[task.id]?.amount ?? task.amount ?? ''} onChange={(e) => updateEditedValue(task.id, 'amount', e.target.value)} className="text-xs border rounded px-1 py-0.5 flex-1" />
                                ) : <span className="text-xs flex-1">{task.amount || '0'}</span>}
                                <button onClick={() => toggleFieldEdit(task.id, 'amount')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>

                              {/* Needs Approval */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted w-20">{t("task.needsApproval")}:</span>
                                {editableFields[task.id]?.needs_approval ? (
                                  <select value={editedValues[task.id]?.needs_approval ?? task.needs_approval ?? 0} onChange={(e) => updateEditedValue(task.id, 'needs_approval', parseInt(e.target.value))} className="text-xs border rounded px-1 py-0.5 flex-1">
                                    <option value="0">{t("common.no")}</option>
                                    <option value="1">{t("common.yes")}</option>
                                  </select>
                                ) : <span className="text-xs flex-1">{task.needs_approval ? t("common.yes") : t("common.no")}</span>}
                                <button onClick={() => toggleFieldEdit(task.id, 'needs_approval')} className="p-1 hover:bg-surface rounded"><Edit2 size={12} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedTasks.size > 0 && targetProjectId && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">{t("task.willImport")}: <strong>{selectedTasks.size}</strong> {t("task.tasks")}</p>
                <p className="text-xs text-text-muted mt-1">{t("task.toProject")}: <strong>{availableProjects.find(p => p?.id === parseInt(targetProjectId))?.name_ar || availableProjects.find(p => p?.id === parseInt(targetProjectId))?.name_en}</strong></p>
              </div>
              <div className="text-end">
                <Badge variant="status-pending" className="text-xs">{t("status.pending")}</Badge>
                <p className="text-xs text-text-muted mt-1">{t("task.autoStatus")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}