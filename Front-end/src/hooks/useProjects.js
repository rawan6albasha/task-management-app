// useProjects.js
import { useState } from 'react';
export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const fetchProjects = async () => { /* API call */ };
  return { projects, fetchProjects };
}