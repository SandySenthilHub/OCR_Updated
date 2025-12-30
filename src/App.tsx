// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from './components/Sidebar.tsx';
import Footer from './components/Footer.tsx';
import Header from './components/Header.tsx';
import KTComponent from './metronic/core';
import { useEffect } from 'react';
import KTLayout from './metronic/app/layouts/demo1.js';
import SearchModal from "./components/SearchModal.tsx";

// Pages
import Dashboard from './components/Trade_Finance/OCR/Dashboard.tsx';
import Upload from "./components/Trade_Finance/OCR/Upload.tsx";
import Sessions from "./components/Trade_Finance/OCR/Sessions.tsx";
import SubControlCenter from "./components/Trade_Finance/OCR/SCC.tsx";
import SessionDetail from "./components/Trade_Finance/OCR/SessionDetail.tsx";
import VesselTracking from "./components/Trade_Finance/OCR/VesselTracking.tsx";
import RoleManagement from "./components/Administration/RoleManagement.tsx";
import UserManagement from "./components/Administration/UserManagement.tsx";
import SessionDetailNew from "./components/Trade_Finance/OCR/SessionDetailNew.tsx";

function App() {
  useEffect(() => {
    KTComponent.init();
    KTLayout.init();
  }, []);

  return (
    <Router>
      <div className="flex grow">
        {/* Sidebar Layout */}
        <Sidebar />
        <div className="wrapper flex grow flex-col">
          <Header />
          <main className="grow content pt-5" id="content" role="content">
            <div className="container-fixed" id="content_container"></div>
            <div className="container-fixed">
              {/* ✅ OCR */}
              <Routes>
                <Route path="/" element={<Navigate to="/tf_genie/discrepancy/dashboard" replace />} />
                <Route path="/tf_genie/discrepancy/dashboard" element={<Dashboard />} />
                <Route path="/tf_genie/discrepancy/create-session" element={<Upload />} />
                <Route path="/tf_genie/discrepancy/ocr-factory" element={<Sessions />} />
                {/* <Route path="/tf_genie/discrepancy/ocr-factory/:sessionId" element={<SessionDetail />} /> */}
                <Route path="/tf_genie/discrepancy/ocr-factory/:sessionId" element={<SessionDetailNew />} />

                <Route path="/tf_genie/discrepancy/control-center" element={<SubControlCenter />} />
                <Route path='/tf_genie/discrepancy/vessels' element={<VesselTracking />} />

                {/* Administration */}
                <Route path="/admin/roles" element={<RoleManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />

              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <SearchModal />
    </Router>
  );
}

export default App;
