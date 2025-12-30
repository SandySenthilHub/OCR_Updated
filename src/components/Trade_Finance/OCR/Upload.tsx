import React, { useState, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';

import {
  Upload as UploadIcon,
  FileText,
  Image,
  X,
  Check,
  AlertCircle,
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  RefreshCw,
  SparklesIcon,
  DownloadCloudIcon,
  DownloadCloud
} from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'processing';
  progress: number;
  error?: string;
  documentId?: string;
  processingProgress?: {
    stage: string;
    progress: number;
    message: string;
    timestamp: string;
  };
}

interface Lifecycle {
  id: string;
  name: string;
  instrument: string;
  transition: string;
  requiredDocuments: string[];
}

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [lifecycles, setLifecycles] = useState<Lifecycle[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<{ [docName: string]: File | null }>({});

  const { sessions, loadSessions, createSession, uploadDocument, isLoading } = useSessionStore();
  const { user } = useAuthStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Inside your Upload component
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // At the top of your Upload component
  const [isNewLifecycle, setIsNewLifecycle] = useState(false);
  const [newLifecycleName, setNewLifecycleName] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [selectedDocumentsFallback, setSelectedDocumentsFallback] = useState({});


  const [mainDocument, setMainDocument] = useState<File | null>(null);
  const [subDocuments, setSubDocuments] = useState<File[]>([]);
  // const [isUploading, setIsUploading] = useState(false);

  // const hasFilesSelected = mainDocument || subDocuments.length > 0;


  const [uploadMode, setUploadMode] = useState("file"); // file | copy

  // MAIN COPY DOC
  const [mainCopyDoc, setMainCopyDoc] = useState({
    name: "",
    content: ""
  });

  // SUB COPY DOCS
  const [subCopyDocs, setSubCopyDocs] = useState([]);



  useEffect(() => {
    if (selectedSession) {
      const lifecycleExists = lifecycles.some(
        lc => `${lc.name} — ${lc.instrument}` === selectedSession.lifecycle
      );
      setIsNewLifecycle(!lifecycleExists);
    }
  }, [selectedSession, lifecycles]);


  const [newSession, setNewSession] = useState({
    cifNumber: '',
    customerId: '',
    lcNumber: '',
    instrument: '',
    lifecycle: '',
    accountName: '',
    customerName: '',
    customerType: ''
  });

  const [focused, setFocused] = useState({
    cifNumber: false,
    customerId: false,
    lcNumber: false,
    instrument: false,
    lifecycle: false,
    accountName: false,
    customerName: false,
    customerType: false
  });

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const [showAllSessions, setShowAllSessions] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeSessions = sessions.filter(s => s.status !== 'completed' && s.status !== 'frozen');
  const filteredSessions = useMemo(() => {
    if (showAllSessions) return activeSessions;
    if (activeSessions.length === 0) return [];

    // default filter by lcNumber of the first session
    const defaultLc = activeSessions[0].lcNumber;
    return activeSessions.filter((s) => s.lcNumber === defaultLc);
  }, [activeSessions, showAllSessions]);

  useEffect(() => {
    const fetchLifecycles = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/lifecycles");
        if (!res.ok) throw new Error("Failed to fetch lifecycles");

        const data = await res.json();
        // console.log("✅ Raw lifecycles from API:", data); // 👈 log raw API response

        const instruments = data.map((item: any) => {
          const mapped = {
            id: item.ID,
            name: item.Instrument,
            instrument: item.Instrument,
            transition: item.Transition,
            fullLifecycle: `${item.Instrument} — ${item.Transition}`,
            requiredDocuments: item.Applicable_Documents
              ? item.Applicable_Documents.split(',').map((d: string) => d.trim())
              : []
          };
          // console.log("🔹 Mapped lifecycle:", mapped); // 👈 log each mapped object
          return mapped;
        });

        setLifecycles(instruments);
        // console.log("🟢 Lifecycles state set:", instruments); // 👈 final state
      } catch (error) {
        console.error("❌ Error fetching lifecycles:", error);
      }
    };

    fetchLifecycles();
  }, []);



  const uniqueInstruments = Array.from(
    new Set(lifecycles.map((item) => item.name))
  );

  const filteredLifecycles = lifecycles.filter(
    (item) => item.name === newSession.instrument
  );

  const handleCreateSession = async () => {
    const payload = {
      cifNumber: newSession.cifNumber.trim(),
      customerId: newSession.customerId?.trim() || null,
      customerName: newSession.customerName.trim(),
      accountName: newSession.accountName?.trim() || null,
      customerType: newSession.customerType.trim(),
      lcNumber: newSession.lcNumber.trim(),
      instrument: newSession.instrument?.trim() || null,
      lifecycle: newSession.lifecycle.trim()
    };

    if (
      !payload.cifNumber ||
      !payload.customerName ||
      !payload.customerType ||
      !payload.lcNumber ||
      !payload.lifecycle
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // ============================
      // 1️⃣ CREATE SESSION
      // ============================
      const sessionRes = await axios.post(
        "http://127.0.0.1:8000/api/v1/sessions",
        payload
      );

      const session = sessionRes.data;
      localStorage.setItem("currentSession", JSON.stringify(session));


      // ============================
      // 2️⃣ CREATE CUSTOMER
      // ============================
      await axios.post(
        "http://127.0.0.1:8000/api/v1/save-customers",
        {
          sessionId: session.id,
          cifNumber: payload.cifNumber,
          customerId: payload.customerId,
          customerName: payload.customerName,
          accountName: payload.accountName,
          customerType: payload.customerType,
          lcNumber: payload.lcNumber,
          instrument: payload.instrument,
          lifecycle: payload.lifecycle
        }
      );

      // ============================
      // 3️⃣ UI UPDATES
      // ============================
      setSelectedSessionId(session.id);
      setShowCreateSession(false);

      setNewSession({
        cifNumber: "",
        customerId: "",
        customerName: "",
        accountName: "",
        customerType: "",
        lcNumber: "",
        instrument: "",
        lifecycle: ""
      });

    } catch (error) {
      console.error("Error creating session/customer:", error);
      alert("Failed to create session or customer");
    }
  };

  const fetchCustomerIfExists = async (cif?: string, customerId?: string) => {
    if (!cif && !customerId) return;

    const res = await axios.get("http://127.0.0.1:8000/api/v1/get-customer", {
      params: {
        cifNumber: cif || undefined,
        customerId: customerId || undefined
      }
    });

    if (!res.data) return;

    setNewSession(prev => ({
      ...prev,
      cifNumber: res.data.cifNumber || prev.cifNumber,
      customerId: res.data.customerId || prev.customerId,
      accountName: res.data.accountName || "",
      customerName: res.data.customerName || "",
      customerType: res.data.customerType || ""
    }));
  };







  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };



  const [isButtonLoading, setIsButtonLoading] = useState(false);
const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

  // Upload function
  const uploadSelectedDocuments = async () => {
    setIsButtonLoading(true);

    if (!selectedSessionId) {
      alert("Please select a session first.");
      setIsButtonLoading(false);
      return;
    }

    // ================= FILE MODE VALIDATION =================
    if (uploadMode === "file") {
      if (!mainDocument && subDocuments.length === 0) {
        alert("Please select at least one document.");
        setIsButtonLoading(false);
        return;
      }
    }

    // ================= COPY MODE VALIDATION =================
    if (uploadMode === "copy") {
      const hasMain = mainCopyDoc.name.trim() && mainCopyDoc.content.trim();
      const hasSub = subCopyDocs.some(d => d.name.trim() && d.content.trim());

      if (!hasMain && !hasSub) {
        alert("Please add at least one document (main or sub).");
        setIsButtonLoading(false);
        return;
      }
    }

    setIsUploading(true);

    try {
      // ================= FILE MODE UPLOAD =================
      if (uploadMode === "file") {
        const uploadedDocs: any[] = [];

        if (mainDocument) {
          const res = await uploadDocumentNew(mainDocument, selectedSessionId);
          uploadedDocs.push(res);
        }

        for (const file of subDocuments) {
          const res = await uploadDocumentNew(file, selectedSessionId);
          uploadedDocs.push(res);
        }
      }

      // ================= COPY MODE UPLOAD =================
      if (uploadMode === "copy") {
        // Upload main document first
        if (mainCopyDoc.name.trim() && mainCopyDoc.content.trim()) {
          const payload = {
            session_id: selectedSessionId,
            product: "trade",
            document_name: mainCopyDoc.name.trim(),
            content: mainCopyDoc.content.trim()
          };

          await axios.post(
            "http://127.0.0.1:8000/api/v1/upload-text-json",
            payload
          );
        }

        // Upload sub-documents individually
        for (const doc of subCopyDocs) {
          if (doc.name.trim() && doc.content.trim()) {
            const payload = {
              session_id: selectedSessionId,
              product: "trade",
              document_name: doc.name.trim(),
              content: doc.content.trim()
            };

            await axios.post(
              "http://127.0.0.1:8000/api/v1/upload-text-json",
              payload
            );
          }
        }
      }

        await delay(5000);


      // ================= RESET STATE =================
      setMainDocument(null);
      setSubDocuments([]);
      setMainCopyDoc({ name: "", content: "" });
      setSubCopyDocs([]);

      navigate(`/tf_genie/discrepancy/ocr-factory/${selectedSessionId}`);

    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setIsButtonLoading(false);
    }
  };



  const uploadDocumentNew = async (
    file: File,
    sessionId: string
  ) => {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const formData = new FormData();

    formData.append("product", "LC");
    formData.append("session_id", sessionId);
    formData.append("files", file);

    const response = await axios.post(
      "http://127.0.0.1:8000/api/v1/upload-bulk",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  };



  const currentSession = JSON.parse(localStorage.getItem("currentSession") || "null");
  const currentCustomerCIF = currentSession?.cifNumber || null;

  const customerSessions =
    currentCustomerCIF
      ? sessions.filter(s => s.cifNumber === currentCustomerCIF)
      : [];


  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="text-center">
            <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-6 bg-slate-200 rounded w-2/3 mx-auto"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}

      <div className="card bg-light p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <DownloadCloudIcon className="text-blue-400" />
          Upload Documents</h1>
        <p className="text-black mt-1">
          Upload trade finance documents for processing. Select an existing session or create a new one to get started.
        </p>
      </div>

      <div className="card bg-light rounded-2xl shadow-sm  p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Create New Session</h3>

        </div>



        {/* New logic */}

        <div className="space-y-6">
          <div className="flex space-x-4">
            {/* CIF Number */}
            <div className="relative flex-1">
              <input
                type="text"
                id="cifNumber"
                value={newSession.cifNumber}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, cifNumber: e.target.value }))
                }
                onBlur={() => {
                  fetchCustomerIfExists(
                    newSession.cifNumber.trim(),
                    newSession.customerId?.trim()
                  );
                }}
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2"
              />


              <label
                htmlFor="cifNumber"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.cifNumber || focused.cifNumber
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Account Number *
              </label>
            </div>

            {/* Customer ID */}
            <div className="relative flex-1">
              <input
                type="text"
                id="customerId"
                value={newSession.customerId}
                onChange={(e) =>
                  setNewSession((prev) => ({
                    ...prev,
                    customerId: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                onBlur={() => {
                  fetchCustomerIfExists(
                    newSession.cifNumber.trim(),
                    newSession.customerId.trim()
                  );
                }}
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2"
              />


              <label
                htmlFor="customerId"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.customerId || focused.customerId
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Customer ID *
              </label>
            </div>




          </div>



          <div className="flex space-x-4">
            {/* LC Number */}
            <div className="relative flex-1">
              <input
                type="text"
                id="lcNumber"
                value={newSession.lcNumber}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, lcNumber: e.target.value }))
                }
                onFocus={() => setFocused((f) => ({ ...f, lcNumber: true }))}
                onBlur={() => setFocused((f) => ({ ...f, lcNumber: false }))}
                placeholder=" "
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label
                htmlFor="lcNumber"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.lcNumber || focused.lcNumber
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                LC Number *
              </label>
            </div>

            {/* Instrument Type (datalist-enabled input) */}
            <div className="relative flex-1">
              <input
                list="instrument-options"
                id="instrument"
                value={newSession.instrument}
                onChange={(e) =>
                  setNewSession((prev) => ({
                    ...prev,
                    instrument: e.target.value,
                    lifecycle: "", // reset lifecycle when instrument changes
                  }))
                }
                onFocus={() => setFocused((f) => ({ ...f, instrument: true }))}
                onBlur={() => setFocused((f) => ({ ...f, instrument: false }))}
                placeholder=" "
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500 bg-white"
                autoComplete="off"
              />
              <datalist id="instrument-options">
                {uniqueInstruments.map((inst, index) => (
                  <option key={index} value={inst} />
                ))}
              </datalist>

              <label
                htmlFor="instrument"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.instrument || focused.instrument
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Instrument Type *
              </label>

              {/* optional chevron icon for visual hint */}
              <div className="pointer-events-none absolute right-3 top-3.5">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">


            {/* Account Name */}
            <div className="relative flex-1">
              <input
                type="text"
                id="accountName"
                value={newSession.accountName}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, accountName: e.target.value }))
                }
                onFocus={() => setFocused((f) => ({ ...f, accountName: true }))}
                onBlur={() => setFocused((f) => ({ ...f, accountName: false }))}
                placeholder=" "
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label
                htmlFor="accountName"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.accountName || focused.accountName
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Account Name *
              </label>
            </div>

            {/* Customer Name */}
            <div className="relative flex-1">
              <input
                type="text"
                id="customerName"
                value={newSession.customerName}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, customerName: e.target.value }))
                }
                onFocus={() => setFocused((f) => ({ ...f, customerName: true }))}
                onBlur={() => setFocused((f) => ({ ...f, customerName: false }))}
                placeholder=" "
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label
                htmlFor="customerName"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.customerName || focused.customerName
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Customer Name *
              </label>
            </div>

            {/* Customer Type */}
            <div className="relative flex-1">
              <input
                type="text"
                id="customerType"
                value={newSession.customerType}
                onChange={(e) =>
                  setNewSession((prev) => ({ ...prev, customerType: e.target.value }))
                }
                onFocus={() => setFocused((f) => ({ ...f, customerType: true }))}
                onBlur={() => setFocused((f) => ({ ...f, customerType: false }))}
                placeholder=" "
                className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label
                htmlFor="customerType"
                className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.customerType || focused.customerType
                  ? "-top-2.5 text-xs text-blue-600 bg-white"
                  : "top-3 text-sm text-slate-500"
                  }`}
              >
                Customer Type *
              </label>
            </div>
          </div>


          {/* Lifecycle (datalist-enabled input) */}
          <div className="relative">
            <input
              list="lifecycle-options"
              id="lifecycle"
              value={newSession.lifecycle}
              onChange={(e) =>
                setNewSession((prev) => ({ ...prev, lifecycle: e.target.value }))
              }
              onFocus={() => setFocused((f) => ({ ...f, lifecycle: true }))}
              onBlur={() => setFocused((f) => ({ ...f, lifecycle: false }))}
              placeholder=" "
              className="peer w-full border border-slate-400 rounded-md px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-500 bg-white"
              autoComplete="off"
            />
            <datalist id="lifecycle-options">
              {lifecycles
                .filter((item) => item.instrument === newSession.instrument)
                .map((item) => (
                  <option key={item.id} value={item.transition} />
                ))}
            </datalist>

            <label
              htmlFor="lifecycle"
              className={`absolute left-3 transition-all duration-150 px-1 pointer-events-none ${newSession.lifecycle || focused.lifecycle
                ? "-top-2.5 text-xs text-blue-600 bg-white"
                : "top-3 text-sm text-slate-500"
                }`}
            >
              Lifecycle *
            </label>

            <div className="pointer-events-none absolute right-3 top-3.5">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>



        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowCreateSession(false)}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSession}
            disabled={
              !newSession.cifNumber ||
              !newSession.customerId ||
              !newSession.lcNumber ||
              !newSession.instrument ||
              !newSession.lifecycle ||
              !newSession.accountName ||
              !newSession.customerName ||
              !newSession.customerType
            }
            // style={{ fontWeight: "600" }}
            className={`flex-1 px-4 py-2 rounded-lg text-blue-600 transition-colors
    ${!newSession.cifNumber ||
                !newSession.customerId ||
                !newSession.lcNumber ||
                !newSession.instrument ||
                !newSession.lifecycle ||
                !newSession.accountName ||
                !newSession.customerName ||
                !newSession.customerType
                ? "bg-blue-100 cursor-not-allowed"
                : "bg-blue-100 hover:bg-blue-200 cursor-pointer"
              }`}
          >
            Create Session
          </button>

        </div>
      </div>

      {/* Session Selection */}
      {currentCustomerCIF && customerSessions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Select Session</h2>

            {/* Toggle View: Show all sessions for current customer */}
            {customerSessions.length > 1 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAllSessions(prev => !prev)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
                >
                  {showAllSessions ? "View Latest Session" : "View All My Sessions"}
                </button>
              </div>
            )}
          </div>

          {/* Filter sessions by current customer's CIF */}
          {(() => {


            const filteredSessions = showAllSessions
              ? customerSessions // show all sessions for this customer
              : customerSessions.length > 0
                ? [customerSessions[customerSessions.length - 1]] // show latest session only
                : [];



            if (filteredSessions.length === 0) {
              return (
                <div className="text-center py-12">
                  <FolderOpen className="mx-auto text-slate-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Sessions</h3>
                  <p className="text-slate-600 mb-4">Create a new session to start uploading documents</p>
                  <button
                    onClick={() => setShowCreateSession(true)}
                    disabled={isUploading}
                    className={`px-6 py-3 rounded-lg text-blue-600 transition-colors
              ${isUploading ? "bg-blue-100 cursor-not-allowed" : "bg-blue-100 hover:bg-blue-200 cursor-pointer"}`}
                  >
                    Create First Session
                  </button>
                </div>
              );
            }

            return (
              <div className="card bg-white p-6 rounded-2xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => !isUploading && setSelectedSessionId(session.id)}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${isUploading
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                        } ${selectedSessionId === session.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{session.lcNumber}</h3>
                          <p className="text-sm text-slate-600">CIF: {session.cifNumber}</p>
                          <p className="text-xs text-slate-500 mt-1">Instrument: {session.instrument}</p>
                          <p className="text-xs text-slate-500 mt-1">Lifecycle: {session.lifecycle}</p>
                        </div>
                        {selectedSessionId === session.id && (
                          <CheckCircle2 className="text-blue-500" size={20} />
                        )}
                      </div>
                      <div className="flex justify-end">
                        <span
                          className={`inline-flex pb-2 pt-1 px-2 text-xs font-medium capitalize rounded-md ${getStatusColor(session.status)}`}
                        >
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Selected Session Upload */}
          {selectedSessionId && (() => {
            const selectedSession = sessions.find(s => s.id === selectedSessionId);
            if (!selectedSession) return null;

            return (
              <div className="mt-6 p-6 border border-slate-200 rounded-2xl bg-slate-50">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Upload LC Documents</h3>

                {/* RADIO BUTTON FOR UPLOAD MODE */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Upload Type</label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2">
                      <input type="radio" checked={uploadMode === "file"} onChange={() => setUploadMode("file")} />
                      <span>PDF / Text File</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" checked={uploadMode === "copy"} onChange={() => setUploadMode("copy")} />
                      <span>Copy & Paste Content</span>
                    </label>
                  </div>
                </div>

                {/* FILE UPLOAD FLOW */}
                {uploadMode === "file" && (
                  <>
                    {/* Main Document */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Main LC Document</label>
                      <div
                        className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-white cursor-pointer"
                        onClick={() => document.getElementById("mainLcInput")?.click()}
                      >
                        <input
                          id="mainLcInput"
                          type="file"
                          accept=".pdf,.txt"
                          className="hidden"
                          onChange={(e) => setMainDocument(e.target.files?.[0] || null)}
                        />
                        <p className="text-slate-600">Click or drag & drop PDF/TXT file</p>
                        {mainDocument && <p className="mt-2 text-green-600 text-sm">Selected: {mainDocument.name}</p>}
                      </div>
                    </div>

                    {/* Sub Documents */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Supporting Documents</label>
                      <div
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-white cursor-pointer"
                        onClick={() => document.getElementById("subDocsInput")?.click()}
                      >
                        <input
                          id="subDocsInput"
                          type="file"
                          multiple
                          accept=".pdf,.txt"
                          className="hidden"
                          onChange={(e) => setSubDocuments(Array.from(e.target.files || []))}
                        />
                        <p className="text-slate-600">Click or drag & drop supporting documents</p>
                        {subDocuments.length > 0 && (
                          <ul className="mt-3 text-sm text-green-700">
                            {subDocuments.map((f, i) => <li key={i}>• {f.name}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* COPY-PASTE FLOW */}
                {uploadMode === "copy" && (
                  <div className="space-y-6">
                    {/* Main Document */}
                    <div className="border border-slate-300 rounded-xl p-4 bg-white">
                      <h4 className="font-semibold text-slate-800 mb-3">Swift Document</h4>
                      <input
                        type="text"
                        placeholder="Document name"
                        value={mainCopyDoc.name}
                        onChange={(e) => setMainCopyDoc(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-3"
                      />
                      <textarea
                        rows={6}
                        placeholder="Paste main document content here..."
                        value={mainCopyDoc.content}
                        onChange={(e) => setMainCopyDoc(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Sub Documents */}
                    <div className="border border-slate-300 rounded-xl p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-slate-800">Sub Documents</h4>
                        <button
                          type="button"
                          onClick={() => setSubCopyDocs(prev => [...prev, { name: "", content: "" }])}
                          className="text-blue-600 text-sm font-medium"
                        >
                          + Add Sub Document
                        </button>
                      </div>
                      {subCopyDocs.length === 0 && <p className="text-sm text-slate-500">No sub documents added</p>}
                      {subCopyDocs.map((doc, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-3 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Sub Document {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => setSubCopyDocs(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Document name"
                            value={doc.name}
                            onChange={(e) => {
                              const updated = [...subCopyDocs];
                              updated[index].name = e.target.value;
                              setSubCopyDocs(updated);
                            }}
                            className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                          />
                          <textarea
                            rows={5}
                            placeholder="Paste document content"
                            value={doc.content}
                            onChange={(e) => {
                              const updated = [...subCopyDocs];
                              updated[index].content = e.target.value;
                              setSubCopyDocs(updated);
                            }}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {(isButtonLoading ||
                  (uploadMode === "file"
                    ? (mainDocument || subDocuments.length > 0)
                    : (mainCopyDoc.name && mainCopyDoc.content) || subCopyDocs.length > 0
                  )) && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={uploadSelectedDocuments}
                        disabled={isButtonLoading}
                        className="bg-green-100 text-green-800 px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-70"
                      >
                        {isButtonLoading && <div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>}
                        <span>{isButtonLoading ? "Processing..." : "Upload"}</span>
                      </button>
                    </div>
                  )}
              </div>
            );
          })()}
        </div>
      )}


    </div>
  );
};

export default Upload;