// src/store/slices/taskSlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import { APP_CONFIG } from '../../config/appConfig';
// ============================================================================
// ⚠️ ملاحظة مهمة: بسبب وجود interceptor في axios.js يرجع res.data مباشرة
// ============================================================================

// -------------------- جلب جميع المهام --------------------


export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      // ✅ نطلب كل المهام مرة واحدة (بدون بايجينشن من الباك)
      // نرسل فقط الفلاتر الأساسية التي قد يحتاجها الباك للأمان
      const response = await api.get("/api/tasks", {
        params: {
          per_page: 1000, // ✅ رقم كبير لجلب كل المهام
          project_id: params.project_id || null, // ✅ فلتر أساسي للأمان
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch tasks");
    }
  }
);

 const fetchTaskTypes = createAsyncThunk(
  "tasks/fetchTaskTypes",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ إضافة طابع زمني لمنع الكاش
      const response = await api.get(`/api/tasks/types`);
      return response.data?.data || response.data || [];
      console.log('task type from slice:',response.data?.data || response.data || [])
    } catch (error) {
      console.error("❌ Failed to fetch task types:", error);
    }
  }
);

// -------------------- إنشاء مهمة جديدة --------------------
export const createTask = createAsyncThunk(
  "tasks/create",
  async (taskData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      Object.keys(taskData).forEach(key => {
        if (key === "files" && taskData.files) {
          taskData.files.forEach(file => formData.append("files[]", file));
        } else if (key === "new_files" && taskData.new_files) {
          taskData.new_files.forEach(file => formData.append("new_files[]", file));
        } else if (key === "library_files" && taskData.library_files) {
          taskData.library_files.forEach((fileId, index) => {
            formData.append(`library_files[${index}]`, fileId);
          });
        } else if (taskData[key] !== null && taskData[key] !== undefined) {
          formData.append(key, taskData[key]);
        }
      });

      const response = await api.post("/api/tasks/store", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      return response.data;
    } catch (error) {
      console.error('🔥 FULL ERROR OBJECT:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data?.message || error.response.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          const messages = Object.values(validationErrors).flat().join('\n');
          return rejectWithValue(`❌ خطأ في البيانات:\n${messages}`);
        }
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create task");
    }
  }
);

// -------------------- تحديث مهمة --------------------


export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ taskId, ...updates }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      formData.append('task_id', Number(taskId));
      formData.append('_method', 'PUT');
      
      Object.keys(updates).forEach(key => {
        const value = updates[key];
        if (value === null || value === undefined || value === '') return;
        
        if (key === 'new_files' && Array.isArray(value)) {
          value.forEach((file) => {
            if (file instanceof File) {
              formData.append('new_files[]', file, file.name);
            }
          });
        }
        else if (key === 'library_files' && Array.isArray(value)) {
          value.forEach((fileId, index) => {
            formData.append(`library_files[${index}]`, fileId);
          });
        }
        else if (['project_id', 'branch_id', 'section_id', 'assigned_id', 'parent_id'].includes(key)) {
          formData.append(key, Number(value));
        }
        else if (key === 'amount') {
          formData.append(key, parseFloat(value).toFixed(2));
        }
        else {
          formData.append(key, value);
        }
      });

      // ✅ الحل الجذري: استخدام fetch بدلاً من axios لتجنب أي interference
      // ✅ استخدام baseURL الكامل من الـ config
const baseUrl = APP_CONFIG.api.baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const apiUrl = `${baseUrl}/api/tasks/update/${taskId}`;
      
      // الحصول على التوكن من localStorage إذا كان موجوداً
      const token = localStorage.getItem('token');
      
      const headers = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
console.log('📤 Sending FormData:');
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
}
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData));
      }

      const result = await response.json();
      return result.data || result;
      
    } catch (error) {
      console.error('🔥 Update Error:', error);
      
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.errors) {
          const messages = Object.values(errorObj.errors).flat().join('\n');
          return rejectWithValue(`❌ خطأ في البيانات:\n${messages}`);
        }
        if (errorObj.message) {
          return rejectWithValue(errorObj.message);
        }
      } catch {}
      
      return rejectWithValue(error.message || "Failed to update task");
    }
  }
);;
// -------------------- جلب مهمة واحدة --------------------
export const fetchTaskById = createAsyncThunk(
  "tasks/fetchById",
  async (taskId, { rejectWithValue }) => {
    try {
      // ✅ استخدام GET مع الـ ID في الـ URL (ليس في الـ body)
      const response = await api.get(`/api/tasks/show/${taskId}`);
      
      // ✅ التعامل مع هيكل الاستجابة المرن (قد يكون في data.data أو data مباشرة)
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch task ${taskId}:`, error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch task");
    }
  }
);

// -------------------- تغيير حالة المهمة --------------------
// ✅ أضف export هنا فقط
// export const updateTaskStatus = createAsyncThunk(
//   "tasks/updateStatus",
//   async ({ taskId, status }, { rejectWithValue }) => {
//     try {
//       const response = await api.post("/api/tasks/update-status", {
//         task_id: Number(taskId),  // ✅ تأكد أنه رقم
//         status: status    
//       });
//       return response.data;
//     } catch (error) {
//       // ✅ إرجاع كائن الخطأ كاملاً ليعالج في المكون
//       return rejectWithValue(error.response?.data || { message: "Failed to update task status" });
//       }
//   }
// );

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      // ✅ PUT مع الـ ID في الـ URL
      // ✅ استخدام اسم الحقل الصحيح: task_status (وليس status)
      const response = await api.put(`/api/tasks/update-status/${taskId}`, {
        task_status: status  // ✅ الحقل الصحيح كما في الـ Controller
      });
      return response.data;
    } catch (error) {
      // ✅ إرجاع كائن الخطأ كاملاً ليعالج في المكون
      return rejectWithValue(error.response?.data || { message: "Failed to update task status" });
    }
  }
);
// -------------------- حذف مهمة --------------------
export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/tasks/delete", { task_id: taskId });
      return taskId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete task");
    }
  }
);

// ✅ ثنك الموافقة/رفض المهمة - مع إضافة export هنا فقط
export const approveTask = createAsyncThunk(
  "tasks/approveTask",
  async ({ taskId, status, refusalReason }, { rejectWithValue }) => {
    try {
      const payload = {
        task_id: taskId,
        status_approval: status,
        ...(status === "rejected" && refusalReason?.trim() && {
          refusal_reason: refusalReason.trim()
        })
      };
      
      const response = await api.post("/api/tasks/approve-task", payload);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("❌ Approve task error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to process approval"
      );
    }
  }
);

// -------------------- الحالة الأولية --------------------
const initialState = {
  tasks: [],
  currentTask: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
    from: null,
    
    to: null
  },
  filters: {
    task_status: "",
    priority: "",
    search: "",
    project_id: null,
    assigned_id: null,
      assigned_id: null,    // ✅ المستخدم
  branch_id: null,      // ✅ الفرع
  section_id: null,     // ✅ القسم
  due_date: null,       // ✅ تاريخ الاستحقاق
  status_approval: null,// ✅ حالة الموافقة
    taskTypes: [],           // ✅ جديد: قائمة أنواع المهام
  taskTypesLoading: false, // ✅ جديد: حالة التحميل
  taskTypesError: null,    // ✅ جديد: حالة الخطأ
    sort_by: "created_at",
    order: "desc",
    page: 1
  },
  loading: false,
  error: null,
  success: null
};

// -------------------- الـ Slice --------------------
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearError: (state) => {
      state.error = null;
      state.success = null;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
    },
      updateCurrentTask: (state, action) => {
    if (state.currentTask?.id === action.payload.id) {
      state.currentTask = { ...state.currentTask, ...action.payload };
      console.log('🔄 currentTask updated locally:', action.payload);
    }
  },
  },
  extraReducers: (builder) => {
    builder
      // ==================== Fetch Tasks ====================
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.data || [];
        state.pagination = {
          current_page: action.payload.current_page || 1,
          last_page: action.payload.last_page || 1,
          total: action.payload.total || 0,
          per_page: action.payload.per_page || 15,
          from: action.payload.from || null,
          to: action.payload.to || null
        };
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== Create Task ====================
      .addCase(createTask.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
        state.pagination.total += 1;
        state.success = "تم إنشاء المهمة بنجاح";
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
          // ==================== Fetch Task Types ====================
    .addCase(fetchTaskTypes.pending, (state) => {
      state.taskTypesLoading = true;
      state.taskTypesError = null;
    })
    .addCase(fetchTaskTypes.fulfilled, (state, action) => {
      state.taskTypesLoading = false;
      state.taskTypes = action.payload;
    })
    .addCase(fetchTaskTypes.rejected, (state, action) => {
      state.taskTypesLoading = false;
      state.taskTypesError = action.payload;
    })
      // ==================== Update Task ====================
      .addCase(updateTask.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        
        // ✅ Laravel يرجع الهيكل: { data: { taskData }, message, code }
        const updatedTask = action.payload?.data || action.payload;
        
        // تحديث في القائمة العامة
        const index = state.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) state.tasks[index] = updatedTask;
        
        // ✅ تحديث المهمة الحالية فوراً (لصفحة التفاصيل)
        if (state.currentTask?.id === updatedTask.id) {
          state.currentTask = updatedTask;
        }
        
        state.success = "تم تحديث المهمة بنجاح";
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ==================== Fetch Task By ID ====================
      .addCase(fetchTaskById.pending, (state) => { state.loading = true; })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== Delete Task ====================
      .addCase(deleteTask.pending, (state) => { state.loading = true; })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        state.pagination.total -= 1;
        state.success = "تم حذف المهمة بنجاح";
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== Update Task Status ====================
      .addCase(updateTaskStatus.pending, (state) => { state.loading = true; })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.tasks[index] = action.payload;
        if (state.currentTask?.id === action.payload.id) state.currentTask = action.payload;
        state.success = "تم تحديث حالة المهمة بنجاح";
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== Approve/Reject Task ✅ ====================
      .addCase(approveTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveTask.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = { ...state.currentTask, ...action.payload };
        }
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = { ...state.tasks[index], ...action.payload };
        }
      })
      .addCase(approveTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// -------------------- Export Actions & Reducer --------------------
export const { 
  setFilters, 
  resetFilters, 
  clearCurrentTask, 
  clearError,
  setSuccess,
  updateCurrentTask,
} = taskSlice.actions;

// ✅ لا حاجة لبلوك export إضافي - كل الـ thunks مُصدَّرة عند تعريفها
export { fetchTaskTypes };
// -------------------- Selectors --------------------
// ✅ استبدل الـ selector الحالي بهذا الكود المُحدَّث
export const selectFilteredTasks = createSelector(
  [(state) => state.tasks.tasks, (state) => state.tasks.filters, (state) => state.auth.user],
  (tasks, filters, currentUser) => {
    return tasks.filter(task => {
      // ✅ فلتر البحث
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const titleAr = task.title_ar?.toLowerCase() || "";
        const titleEn = task.title_en?.toLowerCase() || "";
        const descAr = task.description_ar?.toLowerCase() || "";
        const descEn = task.description_en?.toLowerCase() || "";
        if (!titleAr.includes(search) && !titleEn.includes(search) && 
            !descAr.includes(search) && !descEn.includes(search)) {
          return false;
        }
      }
      
      // ✅ فلتر حالة المهمة
      if (filters.task_status && task.task_status !== filters.task_status) {
        return false;
      }
      
      // ✅ فلتر الأولوية
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      
      // ✅ فلتر المشروع
      if (filters.project_id && task.project_id !== filters.project_id) {
        return false;
      }
      
      // ✅ فلتر المستخدم (المسند إليه)
      if (filters.assigned_id && task.assigned_id !== filters.assigned_id) {
        return false;
      }
      
      // ✅ فلتر الفرع
      if (filters.branch_id && task.branch_id !== filters.branch_id) {
        return false;
      }
      
      // ✅ فلتر القسم
      if (filters.section_id && task.section_id !== filters.section_id) {
        return false;
      }
      
      // ✅ فلتر تاريخ الاستحقاق
      if (filters.due_date) {
        const taskDate = task.due_date?.split('T')[0];
        if (taskDate !== filters.due_date) {
          return false;
        }
      }
      
      // ✅ فلتر حالة الموافقة
      if (filters.status_approval && task.status_approval !== filters.status_approval) {
        return false;
      }

      // ✅ فلتر مهامي (أنشأتها أو مسندة إلي)
      if (filters.my_tasks && filters.my_tasks !== "all") {
        if (!currentUser?.id) return false;

        const isCreatedByMe = String(task.created_by_id) === String(currentUser.id);
        const isAssignedToMe = String(task.assigned_id) === String(currentUser.id);

        if (filters.my_tasks === "created" && !isCreatedByMe) return false;
        if (filters.my_tasks === "assigned" && !isAssignedToMe) return false;
        if (filters.my_tasks === "both" && !isCreatedByMe && !isAssignedToMe) return false;
      }

      return true;
    });
  }
);

export const selectTaskById = (taskId) => (state) => {
  return state.tasks.tasks.find(t => t.id === taskId) || state.tasks.currentTask;
};

export default taskSlice.reducer;