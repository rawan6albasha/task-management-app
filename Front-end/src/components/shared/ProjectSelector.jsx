import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentProject, addProjectMock } from "../../store/slices/projectSlice";
import { FolderPlus, Check } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ProjectSelector() {
  const dispatch = useDispatch();
  const { projects, currentProject } = useSelector((state) => state.project);
  const [isOpen, setIsOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const handleCreateMock = () => {
    if (!newProject.name.trim()) return;
    dispatch(addProjectMock(newProject));
    setIsOpen(false);
    setNewProject({ name: "", description: "" });
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* قائمة اختيار المشروع */}
      <select 
        value={currentProject?.id || ""}
        onChange={(e) => {
          const project = projects.find(p => p.id === Number(e.target.value));
          dispatch(setCurrentProject(project));
        }}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
      >
        <option value="">-- اختر مشروعاً --</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* زر إضافة مشروع سريع */}
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <FolderPlus size={16} className="ms-1" /> مشروع جديد
      </Button>

      {/* مودال الإضافة السريع */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="إنشاء مشروع تجريبي"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateMock}>إنشاء</Button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="اسم المشروع *"
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
          />
      
                        <ReactQuill
                          theme="snow"

            placeholder="وصف مختصر (اختياري)"
            value={newProject.description}
            onChange={(content) => setNewProject({...newProject, description: content})}
                className="h-full"
                style={{ height: '200px' }} modules={editorModules}
                          formats={editorFormats}
 />
          <p className="text-xs text-text-muted">⚠️ هذا مشروع تجريبي محلي، لن يُحفظ في الـ Backend حتى نربط الـ API.</p>
        </div>
      </Modal>
    </div>
  );
}