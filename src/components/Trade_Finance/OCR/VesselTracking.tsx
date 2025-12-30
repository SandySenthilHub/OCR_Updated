import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
    Loader2,
    MapPin,
    Ship,
    Compass,
    Clock,
    Gauge,
    Info,
    BookOpen,
    Search,
} from "lucide-react";

interface Vessel {
    mmsi: number;
    com_state: number;
    status: number;
    pos_acc: boolean;
    raim: boolean;
    lat: number;
    lng: number;
    cog: number;
    sog: number;
    rot: number;
    spare: number;
    hdt: number;
    repeat: number;
    smi: number;
    valid: boolean;
    ts: string;
}

const VesselTracking: React.FC = () => {
    const [mmsi, setMmsi] = useState("");
    const [vessel, setVessel] = useState<Vessel | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusText = (code?: number) => {
        const map: Record<number, string> = {
            0: "Under way using engine",
            1: "At anchor",
            2: "Not under command",
            3: "Restricted manoeuvrability",
            4: "Constrained by draught",
            5: "Moored",
            6: "Aground",
            7: "Engaged in fishing",
            8: "Under way sailing",
            9: "Reserved",
        };
        return code !== undefined ? map[code] || `Unknown (${code})` : "Unknown";
    };

    const fetchVessel = async () => {
        if (!mmsi.trim()) return alert("Please enter an MMSI number first.");
        setLoading(true);
        setError(null);
        setVessel(null);

        try {
            const res = await fetch(`http://127.0.0.1:8000/vessel/${mmsi}`);
            const response = await res.json();

            if (!response?.data) {
                setError(response?.message || "No valid data received.");
                return;
            }

            setVessel(response.data);
        } catch (err) {
            console.error("❌ Fetch error:", err);
            setError("Unable to fetch vessel data.");
        } finally {
            setLoading(false);
        }
    };

    const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    return (
        <div className="p-4 md:p-6 space-y-8">
            {/* Header */}
            <div className="card bg-light p-6">
                <h2 className="flex gap-3 items-center">
                    <Ship className="text-blue-400" />
                    <div className="text-2xl font-bold text-gray-900">Vessel Tracking</div>
                </h2>

                <div
                    className="text-black mt-1"
                >
                    Monitor global vessel movements in real time. Track ship positions,
                    voyage details, and operational statuses with live AIS data. Get
                    instant insights into vessel speed, heading, destination, and
                    estimated arrival — all visualized on an interactive world map.
                </div>

            </div>



            <div className="card bg-light p-6">
                {/* Search Bar */}
                <div
                    className="flex gap-3 mb-6 ml-5"
                    style={{ width: "45%", height: "48px" }}
                >
                    <input
                        className="flex-1 px-4 py-2 rounded-lg  border border-gray-700 text-white-800 placeholder-gray-500 focus:outline-none "
                        value={mmsi}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and limit to 9 digits
                            if (/^\d{0,9}$/.test(value)) {
                                setMmsi(value);
                            }
                        }}
                        placeholder="Enter MMSI number (e.g., 246376000)"
                        inputMode="numeric"
                        maxLength={9}
                    />

                    <button
                        onClick={fetchVessel}
                        disabled={loading}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        {loading ? "Fetching..." : <Search className="w-4 h-4" />}
                        {!loading && "Search"}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}


                {/* 🧭 User Guide Section */}
                <div className="mb-8 mt-8" >

                    <ul className="text-sm text-black space-y-2 pl-5" style={{ listStyle: "outside disc" }}>
                        <li>
                            Enter a valid <b>MMSI number</b> in the search bar below to find a
                            specific vessel.
                        </li>
                        <li>
                            The <b>MMSI (Maritime Mobile Service Identity)</b> is a unique
                            9-digit identifier assigned to each vessel’s radio transmitter.
                        </li>
                        <li>
                            Once found, you’ll see the vessel’s live position, speed, heading,
                            and voyage details displayed on the map.
                        </li>
                        <li>
                            Live tracking is available for vessels transmitting AIS signals in
                            real time.
                        </li>

                        <li>
                            Click the vessel marker on the map to view detailed status
                            information.
                        </li>
                    </ul>
                    <div className="mt-3 text-xs text-gray-400 italic">
                        Tip: MMSI provides the most accurate real-time tracking results.
                    </div>
                </div>

            </div>



            {/* Vessel Info */}
            {vessel && !error && (
                <div className="card bg-light p-6">


                    <h1 className="text-lg font-semibold">
                        Vessel Details
                    </h1>

                    <div className="bg-[#1E1E2D] border border-gray-700 rounded-xl p-5 mb-6 shadow-md transition-all mt-8 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                                <Info className="text-blue-400" /> Vessel Information
                            </h3>
                            <span className="text-sm border border-white text-white px-3 py-1 rounded-lg">
                                MMSI: {vessel.mmsi}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Communication State:</span>{" "}
                                <span className="font-medium">{vessel.com_state}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Status:</span>{" "}
                                <span className="font-medium">{statusText(vessel.status)}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Position Accuracy:</span>{" "}
                                {vessel.pos_acc ? "High" : "Low"}
                            </div>
                            <div>
                                <span className="text-gray-400">RAIM:</span>{" "}
                                {vessel.raim ? "Active" : "Inactive"}
                            </div>
                            <div className="flex items-center gap-1">
                                <Compass className="w-4 h-4 text-yellow-400" />
                                <span className="text-gray-400">Course:</span>{" "}
                                <span className="font-medium">{vessel.cog}°</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gauge className="w-4 h-4 text-green-400" />
                                <span className="text-gray-400">Speed:</span>{" "}
                                <span className="font-medium">{vessel.sog} kn</span>
                            </div>
                            <div>
                                <span className="text-gray-400">ROT:</span> {vessel.rot}
                            </div>
                            <div>
                                <span className="text-gray-400">Spare:</span> {vessel.spare}
                            </div>
                            <div>
                                <span className="text-gray-400">Heading (HDT):</span>{" "}
                                {vessel.hdt}°
                            </div>
                            <div>
                                <span className="text-gray-400">Repeat:</span> {vessel.repeat}
                            </div>
                            <div>
                                <span className="text-gray-400">SMI:</span> {vessel.smi}
                            </div>
                            <div>
                                <span className="text-gray-400">Data Valid:</span>{" "}
                                {vessel.valid ? "✅ Yes" : "❌ No"}
                            </div>
                            <div className="flex items-center gap-1 col-span-2 md:col-span-3">
                                <MapPin className="w-4 h-4 text-red-400" />
                                <span className="text-gray-400">Location:</span>
                                <span className="font-medium ml-1">
                                    {vessel.lat}, {vessel.lng}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 col-span-2 md:col-span-3">
                                <Clock className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-400">Timestamp:</span>
                                <span className="font-medium">{vessel.ts}</span>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    {vessel?.lat && vessel?.lng && (
                        <div className="h-96 rounded overflow-hidden border border-gray-700">
                            <MapContainer
                                center={[vessel.lat, vessel.lng]}
                                zoom={8}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                />
                                <Marker position={[vessel.lat, vessel.lng]}>
                                    <Popup>
                                        <b>MMSI:</b> {vessel.mmsi} <br />
                                        <b>Status:</b> {statusText(vessel.status)} <br />
                                        <b>Speed:</b> {vessel.sog} knots <br />
                                        <b>Course:</b> {vessel.cog}°
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    )}

                </div>
            )}


        </div>
    );
};

export default VesselTracking;
