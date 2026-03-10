import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Building2, FolderOpen, ChevronRight, Save, X } from 'lucide-react';

interface Division {
  id: string;
  company_id: string;
  name: string;
}

interface Project {
  id: string;
  division_id: string;
  name: string;
  description: string;
}

interface Props {
  divisions: Division[];
  projects: Project[];
  companyId: string;
  onAddDivision: (name: string) => Promise<void>;
  onEditDivision: (id: string, name: string) => Promise<void>;
  onDeleteDivision: (id: string) => Promise<void>;
  onAddProject: (divisionId: string, name: string, description: string) => Promise<void>;
  onEditProject: (id: string, name: string, description: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export default function DivisionProjectManagement({
  divisions,
  projects,
  companyId,
  onAddDivision,
  onEditDivision,
  onDeleteDivision,
  onAddProject,
  onEditProject,
  onDeleteProject
}: Props) {
  const [showAddDivision, setShowAddDivision] = useState(false);
  const [showAddProject, setShowAddProject] = useState<string | null>(null);
  const [editingDivision, setEditingDivision] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  const [divisionName, setDivisionName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const toggleDivision = (divisionId: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(divisionId)) {
      newExpanded.delete(divisionId);
    } else {
      newExpanded.add(divisionId);
    }
    setExpandedDivisions(newExpanded);
  };

  const handleAddDivision = async () => {
    if (!divisionName.trim()) return;
    await onAddDivision(divisionName);
    setDivisionName('');
    setShowAddDivision(false);
  };

  const handleAddProject = async (divisionId: string) => {
    if (!projectName.trim()) return;
    await onAddProject(divisionId, projectName, projectDescription);
    setProjectName('');
    setProjectDescription('');
    setShowAddProject(null);
  };

  const getProjectsByDivision = (divisionId: string) => {
    return projects.filter(p => p.division_id === divisionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Division & Project Management
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddDivision(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Division
        </motion.button>
      </div>

      {/* Add Division Form */}
      <AnimatePresence>
        {showAddDivision && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500"
          >
            <h3 className="font-bold text-gray-900 mb-4">Add New Division</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                placeholder="Division name (e.g., ONM, WS)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleAddDivision}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowAddDivision(false);
                  setDivisionName('');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divisions List */}
      <div className="space-y-4">
        {divisions.map((division, index) => {
          const divisionProjects = getProjectsByDivision(division.id);
          const isExpanded = expandedDivisions.has(division.id);

          return (
            <motion.div
              key={division.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Division Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleDivision(division.id)}
                      className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                    >
                      <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <Building2 className="w-6 h-6 text-white" />
                    {editingDivision === division.id ? (
                      <input
                        type="text"
                        defaultValue={division.name}
                        onBlur={(e) => {
                          onEditDivision(division.id, e.target.value);
                          setEditingDivision(null);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            onEditDivision(division.id, e.currentTarget.value);
                            setEditingDivision(null);
                          }
                        }}
                        className="flex-1 px-3 py-1 rounded border-2 border-white"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-white">{division.name}</h3>
                    )}
                    <span className="text-sm text-white/70">({divisionProjects.length} projects)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingDivision(division.id)}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete division "${division.name}"? This will also delete all associated projects.`)) {
                          onDeleteDivision(division.id);
                        }
                      }}
                      className="p-2 text-white hover:bg-red-500/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowAddProject(division.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Project
                    </button>
                  </div>
                </div>
              </div>

              {/* Projects List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 space-y-3"
                  >
                    {/* Add Project Form */}
                    {showAddProject === division.id && (
                      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-500">
                        <h4 className="font-semibold text-gray-900 mb-3">Add New Project</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Project name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="Project description"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddProject(division.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setShowAddProject(null);
                                setProjectName('');
                                setProjectDescription('');
                              }}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {divisionProjects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No projects yet. Click "Add Project" to create one.</p>
                      </div>
                    ) : (
                      divisionProjects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                                {editingProject === project.id ? (
                                  <input
                                    type="text"
                                    defaultValue={project.name}
                                    onBlur={(e) => {
                                      onEditProject(project.id, e.target.value, project.description);
                                      setEditingProject(null);
                                    }}
                                    className="flex-1 px-2 py-1 border-2 border-blue-500 rounded"
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 ml-7">{project.description}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingProject(project.id)}
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete project "${project.name}"?`)) {
                                    onDeleteProject(project.id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {divisions.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No divisions yet. Create your first division to get started.</p>
            <button
              onClick={() => setShowAddDivision(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Create First Division
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
