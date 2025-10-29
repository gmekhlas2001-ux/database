import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { Award, Calendar, TrendingUp, MessageSquare, BookOpen, Filter } from 'lucide-react';

interface GradeWithExam {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  percentage: number;
  grade: string | null;
  remarks: string | null;
  created_at: string;
  exams: {
    name: string;
    description: string | null;
    exam_date: string;
    total_marks: number;
    classroom_id: string;
    classrooms: {
      id: string;
      name: string;
    };
  };
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface Classroom {
  id: string;
  name: string;
  subject: string | null;
}

export function Grades() {
  const { profile } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [grades, setGrades] = useState<GradeWithExam[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    feedback_text: '',
    is_anonymous: true,
  });

  const isStudent = profile?.role_id === 'student';

  useEffect(() => {
    if (profile && isStudent) {
      loadGrades();
      loadTeachers();
      loadClassrooms();
    }
  }, [profile, isStudent]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          exams (
            name,
            description,
            exam_date,
            total_marks,
            classroom_id,
            classrooms (
              id,
              name
            )
          )
        `)
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async () => {
    try {
      const { data: enrollments, error } = await supabase
        .from('classroom_enrollments')
        .select(`
          classrooms (
            id,
            name,
            subject
          )
        `)
        .eq('student_id', profile?.id)
        .eq('status', 'active');

      if (error) throw error;

      const uniqueClassrooms = new Map<string, Classroom>();
      enrollments?.forEach((enrollment: any) => {
        if (enrollment.classrooms) {
          const classroom = enrollment.classrooms;
          uniqueClassrooms.set(classroom.id, {
            id: classroom.id,
            name: classroom.name,
            subject: classroom.subject,
          });
        }
      });

      setClassrooms(Array.from(uniqueClassrooms.values()));
    } catch (error: any) {
      showError(error.message);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data: enrollments, error } = await supabase
        .from('classroom_enrollments')
        .select(`
          classrooms (
            teacher_id,
            profiles (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('student_id', profile?.id)
        .eq('status', 'active');

      if (error) throw error;

      const uniqueTeachers = new Map<string, Teacher>();
      enrollments?.forEach((enrollment: any) => {
        if (enrollment.classrooms?.profiles) {
          const teacher = enrollment.classrooms.profiles;
          uniqueTeachers.set(teacher.id, {
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
          });
        }
      });

      setTeachers(Array.from(uniqueTeachers.values()));
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!selectedTeacher || !feedbackForm.feedback_text.trim()) {
        showError('Please provide feedback text');
        return;
      }

      const { error } = await supabase.from('teacher_feedback').insert({
        teacher_id: selectedTeacher.id,
        student_id: profile?.id,
        rating: feedbackForm.rating,
        feedback_text: feedbackForm.feedback_text.trim(),
        is_anonymous: feedbackForm.is_anonymous,
      });

      if (error) throw error;

      showSuccess('Feedback submitted successfully');
      setShowFeedbackModal(false);
      setSelectedTeacher(null);
      setFeedbackForm({ rating: 5, feedback_text: '', is_anonymous: true });
    } catch (error: any) {
      showError(error.message);
    }
  };

  const openFeedbackModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowFeedbackModal(true);
  };

  const filteredGrades = selectedClassroom === 'all'
    ? grades
    : grades.filter((grade) => grade.exams.classroom_id === selectedClassroom);

  const calculateAverage = () => {
    if (filteredGrades.length === 0) return 0;
    const sum = filteredGrades.reduce((acc, grade) => acc + (grade.percentage || 0), 0);
    return (sum / filteredGrades.length).toFixed(2);
  };

  if (!isStudent) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">This page is only available for students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Grades</h1>
        <p className="text-slate-600 mt-1">View your exam results and submit teacher feedback</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <label className="text-sm font-medium text-slate-700">Filter by Class:</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
          >
            <option value="all">All Classes</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name} {classroom.subject ? `- ${classroom.subject}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Exams</p>
              <p className="text-3xl font-bold mt-1">{filteredGrades.length}</p>
            </div>
            <Award className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Average Score</p>
              <p className="text-3xl font-bold mt-1">{calculateAverage()}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">My Classes</p>
              <p className="text-3xl font-bold mt-1">{classrooms.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">My Teachers</h2>
        {teachers.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No teachers assigned yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="border border-slate-200 rounded-lg p-4">
                <div className="font-medium text-slate-900">{teacher.full_name}</div>
                <div className="text-sm text-slate-600 mt-1">{teacher.email}</div>
                <button
                  onClick={() => openFeedbackModal(teacher)}
                  className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Give Feedback</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredGrades.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {selectedClassroom === 'all' ? 'No grades available yet' : 'No grades available for this class'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Exam Results</h2>
            {selectedClassroom !== 'all' && (
              <div className="text-sm text-slate-600">
                Showing {filteredGrades.length} result{filteredGrades.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          {filteredGrades.map((grade) => (
            <div key={grade.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{grade.exams.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{grade.exams.classrooms.name}</p>
                  {grade.exams.description && (
                    <p className="text-sm text-slate-500 mt-2">{grade.exams.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(grade.exams.exam_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {grade.percentage?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {grade.marks_obtained} / {grade.exams.total_marks} marks
                  </div>
                  {grade.grade && (
                    <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium inline-block">
                      Grade: {grade.grade}
                    </div>
                  )}
                </div>
              </div>
              {grade.remarks && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Teacher's Remarks:</span> {grade.remarks}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showFeedbackModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Give Feedback</h2>
            <p className="text-sm text-slate-600 mb-4">for {selectedTeacher.full_name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rating (1-5)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                      className={`w-12 h-12 rounded-lg font-semibold transition-colors ${
                        feedbackForm.rating === rating
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Feedback *
                </label>
                <textarea
                  value={feedbackForm.feedback_text}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Share your thoughts about this teacher..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={feedbackForm.is_anonymous}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, is_anonymous: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="anonymous" className="ml-2 text-sm text-slate-700">
                  Submit anonymously
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedTeacher(null);
                  setFeedbackForm({ rating: 5, feedback_text: '', is_anonymous: true });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
