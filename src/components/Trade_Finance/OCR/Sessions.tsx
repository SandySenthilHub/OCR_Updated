import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, Edit3, Copy, SparklesIcon, User2Icon, UserStarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { Session } from '../types';

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, loadSessions, isLoading, setCurrentSession, deleteSession } = useSessionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.lcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.cifNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lifecycle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'frozen': return 'bg-gray-100 text-gray-800';
      case 'uploading': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleViewSession = (session: Session) => {
    // Save session data in localStorage
    localStorage.setItem(
      "currentSession",
      JSON.stringify({
        cifNumber: session.cifNumber,
        lcNumber: session.lcNumber,
        lifecycle: session.lifecycle,
        sessionID: session.sessionID || session.id,
        status: session.status,
        createdAt: session.createdAt,
      })
    );

    // Optional: also set state locally if used in this component
    setCurrentSession(session);

    // Navigate to OCR Factory page
    navigate(`/tf_genie/discrepancy/ocr-factory/${session.sessionID || session.id}`);
  };


  const handleDeleteSession = async (documentId: string) => {
    try {
      const documentId = localStorage.getItem('documentId');
      const response = await fetch(`http://localhost:3000/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        // Optionally refresh your document list after deletion
        // fetchDocuments();
      } else {
        console.error("Delete failed:", data.error);
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("An error occurred while deleting the document.");
    }
  };

  const canDeleteSession = (session: Session) => {
    return session.status !== 'completed';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div className=" card bg-light p-6 ">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UserStarIcon className="text-blue-400" />
              Sessions</h1>
            <p className="text-slate-600 mt-1">Manage your document processing sessions</p>
          </div>
          <button
            onClick={() => navigate('/tf_genie/discrepancy/create-session')}
            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by LC Number, CIF, or Lifecycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
              />
            </div>

          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="created">Created</option>
              <option value="uploading">Uploading</option>
              <option value="processing">Processing</option>
              <option value="reviewing">Reviewing</option>
              <option value="completed">Completed</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-blue-100 border-b border-slate-200">
                {[
                  "Session Details",
                  "Status",
                  // "Progress..",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredSessions.map((session, index) => (
                <tr
                  key={session.id}
                  className={`transition-all border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                    } hover:bg-gray-100`}
                >
                  {/* Session Info */}
                  <td className="py-4 px-6">
                    <div>

                       <h3 className="font-semibold text-slate-900 text-sm">
                       Session ID : {session.id}
                      </h3>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {session.lcNumber}
                      </h3>
                      <p className="text-xs text-slate-600">
                        CIF: {session.cifNumber}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-lg text-slate-700">
                        {session.lifecycle || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(
                        session.status
                      )} bg-opacity-10 capitalize`}
                    >
                      <span
                        className={`w-2 h-2 mr-2 rounded-full ${getStatusColor(
                          session.status
                        ).replace("text-", "bg-")}`}
                      ></span>
                      {session.status}
                    </span>
                  </td>

                  {/* Progress Bar */}
                  {/* <td className="py-4 px-6">
  {(() => {
    const statusProgressMap: Record<string, number> = {
      created: 10,
      uploading: 25,
      processing: 50,
      reviewing: 75,
      completed: 100,
      frozen: 0,
    };

    // normalize status: trim and lowercase
    const normalizedStatus = session.status?.trim().toLowerCase() || "";
    const progress = statusProgressMap[normalizedStatus] ?? 0;

    return (
      <div className="flex items-center space-x-2">
        <div className="w-24 bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{progress}%</span>
      </div>
    );
  })()}
</td> */}



                  {/* Created */}
                  <td className="py-4 px-6 text-sm">
                    <p className="text-slate-900">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {/* View */}
                      <button
                        onClick={() => handleViewSession(session)}
                        className="flex items-center justify-center w-8 h-8 rounded-full  text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:scale-105"
                        title="View Session"
                      >
                        <Eye size={15} />
                      </button>
                      {/* 
                      Edit
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full  text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm hover:scale-105"
                        title="Edit Session"
                      >
                        <Edit3 size={15} />
                      </button> */}



                      {/* Delete */}
                      {canDeleteSession(session) && (
                        <button
                          onClick={() => setShowDeleteConfirm(session.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full  text-rose-600 hover:bg-rose-50 transition-all shadow-sm hover:scale-105"
                          title="Delete Session"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Search size={40} className="mx-auto text-slate-400 mb-3" />
                    <h3 className="text-base font-medium text-slate-900 mb-1">
                      No sessions found
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Create your first session to get started."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Session</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-slate-700 mb-6">
              Are you sure you want to delete this session? All documents and data associated with this session will be permanently removed.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;