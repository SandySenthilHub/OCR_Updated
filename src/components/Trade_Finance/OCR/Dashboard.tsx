import React, { useEffect, useState } from "react";
import {
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    Ship,
    Sparkles,
    SparklesIcon,
} from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, loadSessions, isLoading } = useSessionStore();
    const { user } = useAuthStore();

    // 🔹 Local state for recent sessions (from store or localStorage)
    const [recentSessions, setRecentSessions] = useState([]);

    // Load sessions from backend (if available)
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // 🔹 Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem("recentSessions", JSON.stringify(sessions.slice(0, 5)));
            setRecentSessions(sessions.slice(0, 5));
        } else {
            // If no sessions from store, load from localStorage
            const stored = JSON.parse(localStorage.getItem("recentSessions") || "[]");
            setRecentSessions(stored);
        }
    }, [sessions]);

    const stats = [
        {
            title: "Total Sessions",
            value: recentSessions.length,
            icon: FileText,
            bg: "bg-[rgba(59,130,246,0.12)] text-[#2563EB]",
            change: "+12%",
        },
        {
            title: "Completed",
            value: recentSessions.filter((s) => s.status === "completed").length,
            icon: CheckCircle,
            bg: "bg-[rgba(34,197,94,0.12)] text-[#22C55E]",
            change: "+8%",
        },
        {
            title: "In Progress",
            value: recentSessions.filter((s) =>
                ["uploading", "processing", "reviewing"].includes(s.status)
            ).length,
            icon: Clock,
            bg: "bg-[rgba(234,179,8,0.15)] text-[#EAB308]",
            change: "+5%",
        },
        {
            title: "Pending Review",
            value: recentSessions.filter((s) => s.status === "reviewing").length,
            icon: AlertTriangle,
            bg: "bg-[rgba(107,0,58,0.12)] text-[#6B003A]",
            change: "-2%",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "uploading":
                return "text-blue-600";
            case "completed":
                return "text-green-600";
            case "failed":
                return "text-red-600";
            case "pending":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="card p-6 border border-gray-200 shadow-sm"
                            >
                                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            {/* Header */}
            <div className="card bg-light p-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <SparklesIcon className="text-blue-400" />
                    Welcome back, {user?.name}
                </h1>
                <p className="text-black mt-1">
                    Trade Finance Discrepancy Finder — stay updated on your document
                    checks and validations.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`card p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${stat.bg}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{stat.title}</p>
                                <p className="text-3xl font-semibold mt-2">{stat.value}</p>
                                <div className="flex items-center mt-2 text-sm opacity-90">
                                    <TrendingUp size={14} className="mr-1" />
                                    <span>{stat.change}</span>
                                    <span className="ml-1 text-gray-500">vs last month</span>
                                </div>
                            </div>
                            <div className="bg-white/60 p-3 rounded-xl">
                                <stat.icon className="w-6 h-6 opacity-80" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Sessions + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 🔹 Recent Sessions */}
                <div className="card bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
                    {recentSessions.length > 0 ? (
                        <div className="space-y-4">
                            {recentSessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => {
                                        // Save to localStorage
                                        localStorage.setItem(
                                            "currentSession",
                                            JSON.stringify({
                                                cifNumber: session.cifNumber,
                                                lcNumber: session.lcNumber,
                                                lifecycle: session.lifecycle,
                                                sessionID: session.sessionID || session.id,
                                            })
                                        );

                                        // Navigate to session page
                                        navigate(`/tf_genie/discrepancy/ocr-factory/${session.sessionID || session.id}`);
                                    }}
                                    className="cursor-pointer card bg-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-200"
                                    style={{backgroundColor:"rgba(0, 0, 0, 0.01)"}}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {session.lcNumber || "N/A"}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                CIF: {session.cifNumber || "—"}
                                            </p>
                                            {session.lifecycle && (
                                                <p className="text-sm text-gray-600">
                                                    Lifecycle: {session.lifecycle}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {session.createdAt
                                                    ? new Date(session.createdAt).toLocaleDateString()
                                                    : ""}
                                            </p>
                                        </div>

                                        <div
                                            className="card text-right p-1"
                                            style={{
                                                backgroundColor: "#3b82f61f",
                                                borderRadius: "8px",
                                            }}
                                        >
                                            <span
                                                className={`${getStatusColor(session.status)}`}
                                                style={{
                                                    textTransform: "capitalize",
                                                    fontSize: "10px",
                                                }}
                                            >
                                                {session.status || "unknown"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-600">No sessions yet</p>
                            <p className="text-sm text-gray-500">
                                Create your first session to get started
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">
                        Quick Actions
                    </h2>
                    <nav className="space-y-2">
                        <button
                            onClick={() => navigate("/tf_genie/discrepancy/create-session")}
                            className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(59,130,246,0.1)] transition-all"
                        >
                            <i className="ki-filled ki-folder text-blue-500 mr-3 text-xl"></i>
                            Create Session
                        </button>

                        <button
                            onClick={() => navigate("/tf_genie/discrepancy/ocr-factory")}
                            className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(16,185,129,0.1)] transition-all"
                        >
                            <i className="ki-filled ki-laptop text-emerald-500 mr-3 text-xl"></i>
                            OCR Factory
                        </button>

                        {/* <button
                            onClick={() => navigate("/tf_genie/discrepancy/control-center")}
                            className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(14,165,233,0.1)] transition-all"
                        >
                            <i className="ki-filled ki-setting-2 text-sky-500 mr-3 text-xl"></i>
                            Sub Control Center
                        </button> */}

                        {/* <button
                            onClick={() => navigate("/tf_genie/discrepancy/vessel")}
                            className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(14,165,233,0.1)] transition-all"
                        >
                            <i className="ki-filled ki-compass text-sky-500 mr-3 text-xl"></i>
                            Vessel Tracking
                        </button> */}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
