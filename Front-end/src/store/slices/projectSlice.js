// src/store/slices/projectSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import { createSelector } from "@reduxjs/toolkit";

// جلب جميع المشاريع
// في projectSlice.js

export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      console.log('📡 [API] Calling /api/projects...');
      const response = await api.get("/projects");
      
      console.log('✅ [API] Response status:', response.status);
      console.log('✅ [API] Full response:', response);
      console.log('✅ [API] Response data:', response.data);
      
      // التعامل مع هيكلية الـ response
      let projectsData = [];
      if (response.data?.code === 200) {
        projectsData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response.data?.data) {
        projectsData = response.data.data;
      }
      
      console.log('✅ [API] Extracted projects:', projectsData);
      console.log('✅ [API] Projects count:', projectsData.length);
      
      return projectsData;
    } catch (error) {
      console.error('❌ [API] Error fetching projects:', error);
      console.error('❌ [API] Error response:', error.response);
      console.error('❌ [API] Error data:', error.response?.data);
      
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch projects"
      );
    }
  }
);

// جلب مشروع واحد
export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId, { rejectWithValue }) => {
    try {
      console.log(`📡 [Project] Fetching project by ID: ${projectId}`);
      
      // ✅ GET مع الـ ID في الـ URL (ليس في الـ body)
      const response = await api.get(`/projects/show/${projectId}`);
      
      console.log('✅ [Project] Raw API Response:', response);
      console.log('✅ [Project] Response Data:', response.data);
      
      const projectData = response.data?.data || response.data;
      console.log('✅ [Project] Extracted Project:', projectData);
      console.log('✅ [Project] Tasks Count:', projectData.tasks?.length || 0);
      
      return projectData;
    } catch (error) {
      console.error(`❌ [Project] Failed to fetch project ${projectId}:`, error);
      console.error('❌ [Project] Error Response:', error.response);
      console.error('❌ [Project] Error Data:', error.response?.data);
      
      return rejectWithValue(error.response?.data?.message || "Failed to fetch project");
    }
  }
);
// إنشاء مشروع جديد
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(projectData).forEach(key => {
        if (key === 'files') {
          projectData.files.forEach(file => {
            formData.append('files[]', file);
          });
        } else if (projectData[key] !== null && projectData[key] !== undefined) {
          formData.append(key, projectData[key]);
        }
      });

      const response = await api.post("/projects/store", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create project");
    }
  }
);

//عرض المشاريع غير النشطة
export const fetchInactiveProjects = createAsyncThunk(
  "projects/fetchInactive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/projects/get-inactive");
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "فشل جلب المشاريع غير النشطة");
    }
  }
);
//تعديل حالة المشروع 
export const updateProjectStatus = createAsyncThunk(
  "projects/updateStatus",
  async ({ projectId, action }, { rejectWithValue }) => {
    try {
      // ✅ PUT مع الـ ID في الـ URL، وـ action في الـ body
      const response = await api.put(`/api/projects/update-status/${projectId}`, {
        action: action === 1 ? 1 : 0  // ✅ ضمان أنه 0 أو 1 فقط
      });
      return response.data?.data || response.data;
    }  catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update project status");
    }
  }
);
// ✅ أضف هذا الـ thunk بعد بقية الـ async thunks
// export const updateProject = createAsyncThunk(
//   "projects/update",
//   async (projectData, { rejectWithValue }) => {
//     try {
//       const formData = new FormData();
      
//       // ✅ لا نرسل project_id في الـ body، لأنه في الـ URL
//       if (projectData.name_ar !== undefined) formData.append("name_ar", projectData.name_ar);
//       if (projectData.name_en !== undefined) formData.append("name_en", projectData.name_en);
//       if (projectData.start_date) formData.append("start_date", projectData.start_date);
//       if (projectData.expected_expired_date) formData.append("expected_expired_date", projectData.expected_expired_date);
//       if (projectData.project_amount !== undefined && projectData.project_amount !== null) {
//         formData.append("project_amount", parseFloat(projectData.project_amount));
//       }
//       if (projectData.description_ar !== undefined) formData.append("description_ar", projectData.description_ar);
//       if (projectData.description_en !== undefined) formData.append("description_en", projectData.description_en);
//       if (projectData.status) formData.append("status", projectData.status);
//       if (projectData.is_active !== undefined) formData.append("is_active", projectData.is_active);

//       // ✅ PUT مع الـ ID في الـ URL
//       const response = await api.put(`/api/projects/update/${projectData.id || projectData.project_id}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" }
//       });
      
//       return response.data?.data || response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || "فشل في تحديث المشروع");
//     }
//   }
// );
export const updateProject = createAsyncThunk(
  "projects/update",
  async (projectData, { rejectWithValue }) => {
    try {
      const projectId = projectData.id || projectData.project_id;
      
      // ✅ تحضير البيانات بدون FormData
      const payload = {
        name_ar: projectData.name_ar,
        name_en: projectData.name_en,
        start_date: projectData.start_date,
        expected_expired_date: projectData.expected_expired_date,
        project_amount: projectData.project_amount ? parseFloat(projectData.project_amount) : 0,
        description_ar: projectData.description_ar,
        description_en: projectData.description_en,
        status: projectData.status,
        is_active: projectData.is_active,
        project_color: projectData.project_color || "#3b82f6",
      };

      // ✅ إرسال كـ JSON بدلاً من FormData
      const response = await api.put(`/api/projects/update/${projectId}`, payload);
      
      console.log('✅ Update Response:', response.data);
      
      return response.data?.data || response.data;
    } catch (error) {
      console.error('❌ Update Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || "فشل في تحديث المشروع");
    }
  }
);


const initialState = {
  projects: [],
  currentProject: null,
  filters: {    search: "",
    status: "",},
  loading: false,
  error: null,
  success: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.success = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Project By ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
            console.log('📥 Fetched Project:', action.payload); // ✅ للتأكد
      
              // ✅ تأكد أن المهام موجودة في الـ response
  const projectData = action.payload?.data || action.payload;
  console.log('📥 Fetched Project with Tasks:', {
    projectId: projectData.id,
    tasksCount: projectData.tasks?.length || 0,
    tasks: projectData.tasks
  });
      // ✅ تأكد أن الـ payload فيه البيانات
      state.currentProject = action.payload?.data || action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.unshift(action.payload);
        state.success = "تم إنشاء المشروع بنجاح";
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      

          // ==================== Update Project ====================
    .addCase(updateProject.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateProject.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload;
      
      // تحديث في القائمة الرئيسية
      const idx = state.projects.findIndex(p => p.id === updated.id);
      if (idx !== -1) state.projects[idx] = updated;
      
      // تحديث المشروع الحالي إذا كان مفتوحاً
      if (state.currentProject?.id === updated.id) {
        state.currentProject = updated;
      }
    })
    .addCase(updateProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ==================== Update Project Status ====================
    .addCase(updateProjectStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    })

    .addCase(updateProjectStatus.fulfilled, (state, action) => {
      state.loading = false;
      // تحديث المشروع في القائمة
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { 
          ...state.projects[index], 
          is_active: action.payload.is_active  // ✅ تحديث is_active فقط
        };
      }
      // تحديث المشروع الحالي إذا كان مفتوحاً
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { 
          ...state.currentProject, 
          is_active: action.payload.is_active 
        };
      }
    })
    .addCase(updateProjectStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    
      

  },
});

export const { 
   
  setCurrentProject,

    clearCurrentProject,
    // fetchProjects,
  // fetchProjectById,
  // createProject,
  // updateProject,
  cancelProject,
  // updateProjectStatus,
  setFilters,
  clearError,
  } = projectSlice.actions;

// Selectors
// src/store/slices/projectSlice.js

export const selectFilteredProjects = createSelector(
  [(state) => state.project.projects, (state) => state.project.filters],
  (projects, filters) => {
    return projects.filter(project => {
      // ✅ فلتر البحث
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const nameAr = project.name_ar?.toLowerCase() || "";
        const nameEn = project.name_en?.toLowerCase() || "";
        if (!nameAr.includes(search) && !nameEn.includes(search)) {
          return false;
        }
      }
      
      // ✅ فلتر الحالة - يجب أن يتقبل القيم الفارغة و "all"
      if (filters.status && filters.status !== "all" && filters.status !== "") {
        if (project.status !== filters.status) {
          return false;
        }
      }
      
      return true;
    });
  }
);

export const selectProjectById = (projectId) => (state) => {
  return state.project.projects.find(p => p.id === projectId);
};

export default projectSlice.reducer;