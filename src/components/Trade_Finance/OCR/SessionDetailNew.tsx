import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import axios from 'axios';

const tabs = [
  { id: 'draft', label: 'Draft' },
  { id: 'ocr', label: 'OCR' },
  { id: 'classification', label: 'Classification' },
  { id: 'final_ocr', label: 'Assemble workshop' },
  { id: 'summary', label: 'Summary' },
];

const SessionDetailNew: React.FC = () => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('draft');
  const [loading, setLoading] = useState(false);

  const currentSession = useSessionStore((state) => state.currentSession);
  const currentSessionLocal = localStorage.getItem("currentSession");
  const parsedSession = currentSessionLocal ? JSON.parse(currentSessionLocal) : null;

  const sessionId = currentSession?.id || parsedSession?.id || paramSessionId;

  // Multiple drafts
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // Tab data
  const [ocrPages, setOcrPages] = useState<any[]>([]);
  const [classificationPages, setClassificationPages] = useState<any[]>([]);
  const [finalOcrPages, setFinalOcrPages] = useState<any[]>([]);
  const [summaryPages, setSummaryPages] = useState<Record<string, any>>({});

  // review and edit

  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedText, setEditedText] = useState<Record<string, string>>({});
  const [finalizedDocs, setFinalizedDocs] = useState<Set<string>>(new Set());
  const [isFinalized, setIsFinalized] = useState(false);
  const [reviewer, setReviewer] = useState("Sandhya");
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);


  const [previewDocId, setPreviewDocId] = useState<string | null>(null);




  const saveEdits = async (
    docId: string,
    docJson: any
  ) => {
    setSaving(true);
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/v1/review/${docId}`,
        {
          documents_json: JSON.stringify(docJson),
          user: reviewer
        }
      );

      // alert("Saved successfully");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    fetchSummary(selectedDraftId);

  }, [selectedDraftId]);

const fetchSummary = async (docId: string) => {
  try {
    const res = await axios.get(`http://127.0.0.1:8000/api/v1/summary/current/${docId}`);
    let records = res.data;

    // Ensure records is an array
    if (!Array.isArray(records)) records = [records];

    console.log("Summary fetch response:", records);

    if (records.length > 0 && records[0].documents_json) {
      let finalJson = {};
      try {
        finalJson = JSON.parse(records[0].documents_json);
        if (Array.isArray(finalJson)) finalJson = { default: finalJson };
      } catch (err) {
        console.error("Error parsing documents_json:", err);
      }

      setSummaryPages(finalJson);
      setIsFinalized(Object.keys(finalJson).length > 0);
    } else {
      setSummaryPages({});
      setIsFinalized(false);
    }
  } catch (err) {
    console.error("Final OCR fetch failed:", err);
    setSummaryPages({});
    setIsFinalized(false);
  }
};







  const finalizeDocument = async (docId: string) => {
    setApproving(true);
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/v1/review/${docId}/approve`,
        reviewer
      );


      setIsFinalized(true);

      // 🔥 REFRESH SUMMARY DATA
      await fetchSummary(docId);

      // optional: auto-switch to summary tab
      setActiveTab("summary");

    } catch (e) {
      console.error(e);
      alert("Approval failed");
    } finally {
      setApproving(false);
    }
  };








  // Fetch drafts initially
  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);

    axios.get(`http://127.0.0.1:8000/api/v1/drafts/current/${sessionId}`)
      .then(res => {
        const draftData = Array.isArray(res.data) ? res.data : [res.data];
        setDrafts(draftData);

        if (draftData.length > 0) {
          setSelectedDraftId(draftData[0].doc_id); // default select first draft
        }
      })
      .catch(err => console.error('Draft fetch error:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Fetch tab data whenever selected draft changes
  useEffect(() => {
    if (!selectedDraftId) return;

    setLoading(true);

    const fetchTabData = async () => {
      try {
        const [ocrRes, classificationRes, finalOcrRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/v1/ocr/current/${selectedDraftId}`),
          axios.get(`http://127.0.0.1:8000/api/v1/classification/current/${selectedDraftId}`),
          axios.get(`http://127.0.0.1:8000/api/v1/final_ocr/current/${selectedDraftId}`)
        ]);

        setOcrPages(ocrRes.data || []);
        setClassificationPages(classificationRes.data || []);
        const finalOcrData = finalOcrRes.data || [];
        setFinalOcrPages(finalOcrData);

        // 🔥 CHECK FINALIZED STATE
        if (finalOcrData.length > 0 && finalOcrData[0].status === "APPROVED") {
          setIsFinalized(true);

          // auto-fetch summary if finalized
          fetchSummary(selectedDraftId);
        }


        // const summaryData = summaryRes.data
        //   ? Array.isArray(summaryRes.data)
        //     ? summaryRes.data
        //     : [summaryRes.data]
        //   : [];
        // setSummaryPages(summaryData);

      } catch (err) {
        console.error('Tab data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTabData();
  }, [selectedDraftId]);


  // Helper function to format datetime
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const normalizeText = (text?: string) => {
    if (!text) return '-';

    return text
      .replace(/"/g, '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const normalizeDocName = (name: string) =>
    name
      .replace(/["']/g, '')      // remove quotes
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());


  // Get selected draft object
  const selectedDraft = drafts.find(d => d.doc_id === selectedDraftId) || null;

  const currentSessionID = JSON.parse(
    localStorage.getItem("currentSession")
  );
  const session_Id = currentSessionID?.id;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tf_genie/discrepancy/ocr-factory')}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              SESSION ID: {currentSession?.id || session_Id}

            </h1>
            <p className="text-slate-600">
              LC No : {currentSession?.lcNumber || parsedSession?.lcNumber} | CIF: {currentSession?.cifNumber || parsedSession?.cifNumber} | Lifecycle: {currentSession?.lifecycle || parsedSession?.lifecycle}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-slate-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.filter(tab => {
            if (tab.id !== 'summary') return true;
            // Only show summary if there is data
            return summaryPages && Object.keys(summaryPages).length > 0;
          }).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-4 font-medium ${activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}


        </nav>
      </div>

      {/* Loading */}
      {/* {loading && <p>Loading...</p>} */}

      {/* Draft Tab */}
      {activeTab === 'draft' && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-slate-100 mb-2">
              <tr className="bg-blue-100 border-b border-slate-200">
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  Document Name
                </th>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  File Path
                </th>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  Preview
                </th>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                  Processed At
                </th>
              </tr>
            </thead>

            <tbody>
              {drafts.length > 0 ? (
                drafts.map(d => {
                  const fileName = d.file_path.split(/[/\\]/).pop();
                  const fileUrl = `http://127.0.0.1:8000/uploads/${fileName}`;
                  const isOpen = previewDocId === d.doc_id;

                  return (
                    <React.Fragment key={d.doc_id}>
                      {/* MAIN ROW */}
                      <tr className="transition-all border-b border-slate-100 bg-white hover:bg-gray-100">
                        <td className="py-4 px-6">{d.document_name}</td>

                        <td className="py-4 px-6 text-slate-700">
                          {`${fileName}`}
                        </td>

                        {/* PREVIEW BUTTON */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() =>
                              setPreviewDocId(isOpen ? null : d.doc_id)
                            }
                            className="text-blue-600 text-sm font-semibold hover:underline"
                          >
                            {isOpen ? "Hide Preview" : "Preview"}
                          </button>
                        </td>

                        <td className="py-4 px-6">
                          {formatDateTime(d.processed_at)}
                        </td>
                      </tr>

                      {/* PREVIEW ROW */}
                      {isOpen && (
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="p-4">
                            <iframe
                              src={fileUrl}
                              className="w-full h-[500px] border rounded"
                              title="PDF Preview"
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-slate-500">
                    No drafts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}



      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <>
          {/* Draft Selection */}
          {drafts.length > 1 && (
            <div className="mb-4">
              <label className="mr-2 font-semibold">Select Document:</label>
              <select
                value={selectedDraftId || ""}
                onChange={(e) => setSelectedDraftId(e.target.value)}
                className="border p-1 rounded"
              >
                {drafts.map(d => (
                  <option key={d.doc_id} value={d.doc_id}>
                    {d.document_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show only selected draft content */}
          {selectedDraft && ocrPages.length > 0 ? (
            <div className="overflow-x-auto">
              {ocrPages.map((page) => {
                const lines = page.extracted_text?.split(/\r?\n/) || [];
                const kvPairs: { key?: string; value: string }[] = [];
                let currentKey: string | undefined;
                let currentValue = "";

                lines.forEach((line: string) => {
                  if (line.includes(":")) {
                    if (currentKey || currentValue) kvPairs.push({ key: currentKey, value: currentValue.trim() });
                    const [k, ...rest] = line.split(":");
                    currentKey = k.trim();
                    currentValue = rest.join(":").trim();
                  } else {
                    currentValue += " " + line.trim();
                  }
                });
                if (currentKey || currentValue) kvPairs.push({ key: currentKey, value: currentValue.trim() });

                return (
                  <div key={page.doc_id + '-' + page.page_no} className="mb-8">
                    <h3 className="font-semibold mb-2">{selectedDraft.document_name} - Page {page.page_no}</h3>
                    <table className="table-auto w-full border-collapse">
                      <thead className="bg-slate-100 mb-2">
                        <tr className='bg-blue-100 border-b border-slate-200'>
                          <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Key</th>
                          <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kvPairs.map((item, idx) => (
                          <tr key={idx} className="transition-all border-b border-slate-100 bg-white hover:bg-gray-100">
                            <td className="px-4 py-6 ">{item.key || ""}</td>
                            <td className="px-4 py-6 ">{item.value}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="px-4 py-6">Signature/Stamp</td>
                          <td className="px-4 py-6">{page.signature_stamp || "No signature detected"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ) : !loading && <p>No OCR pages found for the selected document.</p>}
        </>
      )}


      {/* Classification Tab */}
      {activeTab === 'classification' && (
        classificationPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse">
              <thead className="bg-slate-100 mb-2">
                <tr className='bg-blue-100 border-b border-slate-200'>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Page No</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Code</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Name</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Extracted Text</th>
                </tr>
              </thead>
              <tbody>
                {classificationPages.map(page => (
                  <tr key={page.doc_id + '-' + page.page_no} className="transition-all border-b border-slate-100 bg-white hover:bg-gray-100">
                    <td className="px-4 py-6">{page.page_no}</td>
                    <td className="px-4 py-6">{page.classified_code}</td>
                    <td className="px-4 py-6">  {normalizeText(page.classified_name)}</td>
                    <td className="px-4 py-6 max-w-xl">
                      <div className="overflow-y-auto max-h-48 whitespace-pre-wrap break-words p-2 border rounded">
                        {page.extracted_text}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && <p>No classification data found.</p>
      )}

      {/* Final OCR Tab */}
      {activeTab === 'final_ocr' && (
        finalOcrPages.length > 0 ? (
          <div className="overflow-x-auto max-h-screen">

            <table className="table-auto w-full border-collapse">
              <thead className="bg-slate-100 mb-2">
                <tr className="bg-blue-100 border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">File Path</th>
                  {/* <th className="px-4 py-4 border-b">Whole Text</th> */}
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Extracted text</th>
                </tr>
              </thead>
              <tbody>
                {finalOcrPages.map((page, index) => {
                  const keyValues = page.whole_text?.split(/\n(?=[^:\n]+:)/).map((line: string) => {
                    const [key, ...rest] = line.split(':');
                    return { key: key?.trim(), value: rest.join(':').trim() };
                  }) || [];

                  let docJson: any = {};
                  try {
                    docJson = JSON.parse(page.documents_json);
                  } catch {
                    docJson = { error: 'Invalid JSON' };
                  }

                  return (
                    <tr key={page.doc_id + '-' + page.page_no}
                      className='transition-all border-b border-slate-100 bg-white hover:bg-gray-100'
                    >
                      <td className="py-4 px-6">
                        {`uploads/${page.file_path.split(/[/\\]/).pop()}`}
                      </td>

                      <td className="px-4 py-6 align-top">

                        <div className="overflow-y-auto max-h-96 p-4 border rounded bg-slate-50">
                          {!isFinalized && (
                            <button
                              disabled={approving}
                              onClick={() => finalizeDocument(page.doc_id)}
                              className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
                            >
                              {approving ? "Finalizing..." : "Finalize Document"}
                            </button>
                          )}




                          {Object.entries(docJson).map(([docType, pagesOrArray]: any) => {
                            const pagesArray = Array.isArray(pagesOrArray)
                              ? pagesOrArray
                              : [pagesOrArray];

                            return (
                              <div key={docType} className="mb-6">

                                {/* Document Name */}
                                <div className="font-bold text-slate-800 mb-3">
                                  {normalizeDocName(docType)}
                                </div>

                                {pagesArray.map((p: any) => {
                                  const rowKey = `${page.doc_id}_${p.page_no}`;

                                  return (
                                    <React.Fragment key={rowKey}>

                                      <div className="mb-4 pl-4 border-l-4 border-slate-300 bg-white rounded p-3">

                                        {/* Page No */}
                                        <div className="text-sm text-slate-600 mb-1">
                                          <span className="font-semibold">Page No:</span> {p.page_no}
                                        </div>

                                        {/* Extracted Text */}
                                        <div className="text-sm mb-2">
                                          <div className="font-semibold text-slate-700 mb-1">
                                            Extracted Text:
                                          </div>

                                          {/* <div className="text-sm mb-2">
                                              <div className="font-semibold text-slate-700 mb-1">Reviewer Comments:</div>
                                              <textarea
                                                className="w-full text-xs text-slate-800 bg-white border rounded p-2 min-h-[80px]"
                                                placeholder="Enter your comments here"
                                                value={reviewComments[rowKey] ?? p.comment ?? ''}
                                                onChange={(e) =>
                                                  setReviewComments(prev => ({ ...prev, [rowKey]: e.target.value }))
                                                }
                                              />
                                            </div> */}

                                          {/* ACTION BUTTONS */}
                                          <div className="flex gap-3 mt-2 mb-4">

                                            {!isFinalized && !editMode[rowKey] && (
                                              <button
                                                className="bg-blue-100 text-blue-600 px-4 py-2 rounded"
                                                onClick={() => {
                                                  setEditMode(prev => ({ ...prev, [rowKey]: true }));
                                                  setEditedText(prev => ({ ...prev, [rowKey]: p.text }));
                                                }}
                                              >
                                                Edit
                                              </button>
                                            )}


                                            {!isFinalized && editMode[rowKey] && (
                                              <button
                                                className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded"
                                                onClick={() => {
                                                  const pageObj = docJson[docType].find(
                                                    (x: any) => x.page_no === p.page_no
                                                  );

                                                  pageObj.text = editedText[rowKey];
                                                  saveEdits(page.doc_id, docJson);
                                                  setEditMode(prev => ({ ...prev, [rowKey]: false }));
                                                }}
                                              >
                                                Save
                                              </button>
                                            )}


                                          </div>


                                          {editMode[rowKey] && !isFinalized ? (
                                            <textarea
                                              className="w-full text-xs text-slate-800 bg-white border rounded p-2 min-h-[120px]"
                                              value={editedText[rowKey] ?? p.text}
                                              onChange={(e) =>
                                                setEditedText(prev => ({
                                                  ...prev,
                                                  [rowKey]: e.target.value
                                                }))
                                              }
                                            />
                                          ) : (
                                            <pre className="whitespace-pre-wrap text-xs text-slate-800 bg-slate-100 p-2 rounded">
                                              {editedText[rowKey] ?? p.text}
                                            </pre>
                                          )}
                                        </div>



                                        {/* Signature */}
                                        <div className="text-sm text-slate-700 mt-2">
                                          <span className="font-semibold">Signature / Stamp:</span>{' '}
                                          {p.signature_stamp}
                                        </div>

                                      </div>

                                    </React.Fragment>
                                  );
                                })}

                              </div>
                            );
                          })}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !loading && <p>No Final OCR pages found.</p>
      )}



      {/* Summary Tab */}
      {activeTab === 'summary' && (
        summaryPages && Object.keys(summaryPages).length > 0 ? (
          <div className="overflow-x-auto max-h-screen">
            <table className="table-auto w-full border-collapse">
              <thead className="bg-slate-100 mb-2">
                <tr className='bg-blue-100 border-b border-slate-200'>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Document Name</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Product</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Document List</th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-slate-700 uppercase tracking-wide">Extracted Text</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="px-4 py-6">
                    {Object.entries(summaryPages).map(([docType, pages]: any) => {
                      const pagesArray = Array.isArray(pages) ? pages : [pages];

                      return (
                        <div key={docType} className="mb-8">

                          <div className="font-bold text-slate-800 text-lg mb-4">
                            {normalizeDocName(docType)}
                          </div>

                          {pagesArray.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="mb-4 pl-4 border-l-4 border-slate-300 bg-white rounded p-3"
                            >
                              <div className="text-sm text-slate-600 mb-1">
                                <span className="font-semibold">Page No:</span> {p.page_no}
                              </div>

                              <div className="text-sm mb-2">
                                <div className="font-semibold text-slate-700 mb-1">
                                  Extracted Text:
                                </div>
                                <pre className="whitespace-pre-wrap text-xs bg-slate-100 p-2 rounded">
                                  {p.text}
                                </pre>
                              </div>

                              <div className="text-sm text-slate-700">
                                <span className="font-semibold">Signature / Stamp:</span>{" "}
                                {p.signature_stamp}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : !loading ? <p>No Summary found.</p> : null
      )}


    </div>
  );
};

export default SessionDetailNew;
