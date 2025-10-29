import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { Plus, Edit2, Trash2, Award, Calendar } from 'lucide-react';

interface Exam {
  id: string;
  classroom_id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  exam_date: string;
  total_marks: number;
  created_at: string;
  classrooms?: {
    name: string;
    branch_id: string;
  };
}

interface Classroom {
  id: string;
  name: string;
  branch_id: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Grade {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  percentage: number;
  grade: string | null;
  remarks: string | null;
}

export function Exams() {
  const { profile } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [examForm, setExamForm] = useState({
    classroom_id: '',
    name: '',
    description: '',
    exam_date: '',
    total_marks: 100,
  });

  const [gradeForm, setGradeForm] = useState<Record<string, { marks: string; grade: string; remarks: string }>>({});

  const isAdmin = profile?.role_id === 'admin' || profile?.is_super_admin;
  const isTeacher = profile?.role_id === 'teacher' || isAdmin;

  useEffect(() => {
    if (profile) {
      loadExams();
      loadClassrooms();
    }
  }, [profile]);

  const loadExams = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('exams')
        .select(`
          *,
          classrooms (
            name,
            branch_id
          )
        `)
        .order('exam_date', { ascending: false });

      if (!isAdmin) {
        query = query.eq('teacher_id', profile?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async () => {
    try {
      if (profile?.role_id === 'student') {
        const { data, error } = await supabase
          .from('classroom_enrollments')
          .select(`
            classroom_id,
            classrooms (
              id,
              name,
              branch_id,
              teacher_id,
              grade_level,
              section,
              academic_year,
              created_at
            )
          `)
          .eq('student_id', profile.id)
          .eq('status', 'active');

        if (error) throw error;

        const classroomData = data?.map((enrollment: any) => enrollment.classrooms).filter(Boolean) || [];
        setClassrooms(classroomData);
      } else {
        let query = supabase.from('classrooms').select('*');

        if (!isAdmin) {
          query = query.eq('teacher_id', profile?.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setClassrooms(data || []);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const loadStudentsAndGrades = async (examId: string, classroomId: string) => {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('classroom_enrollments')
        .select(`
          student_id,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('classroom_id', classroomId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const studentsList = enrollments?.map((e: any) => ({
        id: e.profiles.id,
        full_name: e.profiles.full_name,
        email: e.profiles.email,
      })) || [];

      setStudents(studentsList);

      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('exam_id', examId);

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      const gradeFormData: Record<string, { marks: string; grade: string; remarks: string }> = {};
      studentsList.forEach((student: Student) => {
        const existingGrade = gradesData?.find((g: Grade) => g.student_id === student.id);
        gradeFormData[student.id] = {
          marks: existingGrade?.marks_obtained?.toString() || '',
          grade: existingGrade?.grade || '',
          remarks: existingGrade?.remarks || '',
        };
      });
      setGradeForm(gradeFormData);
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleCreateExam = async () => {
    try {
      if (!examForm.classroom_id || !examForm.name || !examForm.exam_date) {
        showError('Please fill in all required fields');
        return;
      }

      const { error } = await supabase.from('exams').insert({
        classroom_id: examForm.classroom_id,
        teacher_id: profile?.id,
        name: examForm.name,
        description: examForm.description || null,
        exam_date: examForm.exam_date,
        total_marks: examForm.total_marks,
      });

      if (error) throw error;

      showSuccess('Exam created successfully');
      setShowExamModal(false);
      setExamForm({ classroom_id: '', name: '', description: '', exam_date: '', total_marks: 100 });
      loadExams();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);

      if (error) throw error;

      showSuccess('Exam deleted successfully');
      loadExams();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleSaveGrades = async () => {
    try {
      if (!selectedExam) return;

      const gradesToUpsert = Object.entries(gradeForm)
        .filter(([_, value]) => value.marks !== '')
        .map(([studentId, value]) => ({
          exam_id: selectedExam.id,
          student_id: studentId,
          marks_obtained: parseFloat(value.marks),
          grade: value.grade || null,
          remarks: value.remarks || null,
        }));

      if (gradesToUpsert.length === 0) {
        showError('Please enter at least one grade');
        return;
      }

      const { error } = await supabase
        .from('grades')
        .upsert(gradesToUpsert, { onConflict: 'exam_id,student_id' });

      if (error) throw error;

      showSuccess('Grades saved successfully');
      setShowGradeModal(false);
      setSelectedExam(null);
    } catch (error: any) {
      showError(error.message);
    }
  };

  const openGradeModal = (exam: Exam) => {
    setSelectedExam(exam);
    loadStudentsAndGrades(exam.id, exam.classroom_id);
    setShowGradeModal(true);
  };

  if (!isTeacher) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Exams</h1>
          <p className="text-slate-600 mt-1">Manage exams and grades</p>
        </div>
        <button
          onClick={() => setShowExamModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Exam</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No exams created yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{exam.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{exam.classrooms?.name}</p>
                  {exam.description && (
                    <p className="text-sm text-slate-500 mt-2">{exam.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{exam.total_marks} marks</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openGradeModal(exam)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Add/Edit Grades"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Exam</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Classroom *
                </label>
                <select
                  value={examForm.classroom_id}
                  onChange={(e) => setExamForm({ ...examForm, classroom_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select classroom</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mid-term, Final, Quiz, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Date *
                </label>
                <input
                  type="date"
                  value={examForm.exam_date}
                  onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  value={examForm.total_marks}
                  onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExamModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExam}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showGradeModal && selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedExam.name}</h2>
            <p className="text-sm text-slate-600 mb-4">
              Total Marks: {selectedExam.total_marks} | Date: {new Date(selectedExam.exam_date).toLocaleDateString()}
            </p>

            <div className="space-y-4">
              {students.length === 0 ? (
                <p className="text-center text-slate-600 py-8">No students enrolled in this classroom</p>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="font-medium text-slate-900 mb-3">{student.full_name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Marks Obtained
                        </label>
                        <input
                          type="number"
                          value={gradeForm[student.id]?.marks || ''}
                          onChange={(e) =>
                            setGradeForm({
                              ...gradeForm,
                              [student.id]: { ...gradeForm[student.id], marks: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                          max={selectedExam.total_marks}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Grade
                        </label>
                        <input
                          type="text"
                          value={gradeForm[student.id]?.grade || ''}
                          onChange={(e) =>
                            setGradeForm({
                              ...gradeForm,
                              [student.id]: { ...gradeForm[student.id], grade: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="A, B, C, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Remarks
                        </label>
                        <input
                          type="text"
                          value={gradeForm[student.id]?.remarks || ''}
                          onChange={(e) =>
                            setGradeForm({
                              ...gradeForm,
                              [student.id]: { ...gradeForm[student.id], remarks: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedExam(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrades}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Grades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
