import React, { useState } from 'react';
import {
  X,
  Wifi,
  Cpu,
  Usb,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

interface HardwareConnectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const HardwareConnectModal: React.FC<HardwareConnectModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    isConnectModalOpen: contextIsOpen,
    setIsConnectModalOpen,
    operatingMode,
    hardwareStatus,
    hardwareConnectionType,
    hardwareEndpoint,
    hardwareError,
    connectHardware,
    disconnectHardware,
    setHardwareEndpoint,
    launchSimulationDemo,
    exitSimulationDemo,
  } = useSystem();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const handleClose = propOnClose || (() => setIsConnectModalOpen(false));

  const [endpointInput, setEndpointInput] = useState<string>(hardwareEndpoint || 'ws://192.168.4.1:81');
  const [selectedMethod, setSelectedMethod] = useState<'WEBSOCKET' | 'SERIAL'>('WEBSOCKET');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConnectWebSocket = async () => {
    setIsSubmitting(true);
    setHardwareEndpoint(endpointInput);
    const success = await connectHardware('WEBSOCKET', endpointInput);
    setIsSubmitting(false);
    if (success) {
      handleClose();
    }
  };

  const handleConnectSerial = async () => {
    setIsSubmitting(true);
    const success = await connectHardware('SERIAL');
    setIsSubmitting(false);
    if (success) {
      handleClose();
    }
  };

  const handleLaunchDemo = () => {
    launchSimulationDemo();
    handleClose();
  };

  const handleExitDemo = () => {
    exitSimulationDemo();
  };

  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Connection & Operating Mode</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose how you want to run the road health monitoring system.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current State Status Bar (if already active) */}
        {(hardwareStatus === 'CONNECTED' || operatingMode === 'SIMULATION') && (
          <div className="my-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {hardwareStatus === 'CONNECTED' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 truncate">
                    Connected to ESP32 via <strong className="text-emerald-400">{hardwareConnectionType}</strong>
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-200">Simulation Demo is currently active</span>
                </>
              )}
            </div>

            {hardwareStatus === 'CONNECTED' ? (
              <button
                onClick={() => disconnectHardware()}
                className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors shrink-0"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleExitDemo}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shrink-0"
              >
                Exit Demo
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 my-4">
          {/* Choice 1: Connect Physical ESP32 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Connect Physical ESP32</h3>
                  <p className="text-xs text-slate-400">Receive real sensor readings from your hardware.</p>
                </div>
              </div>
            </div>

            {/* Error Message with Retry */}
            {hardwareError && (
              <div className="my-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{hardwareError}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={selectedMethod === 'WEBSOCKET' ? handleConnectWebSocket : handleConnectSerial}
                    className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {/* Method Tabs */}
            <div className="mt-3 flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedMethod('WEBSOCKET')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
                  selectedMethod === 'WEBSOCKET'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Wi-Fi WebSocket</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('SERIAL')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
                  selectedMethod === 'SERIAL'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Usb className="w-3.5 h-3.5" />
                <span>USB Serial</span>
              </button>
            </div>

            {/* Form Fields according to chosen method */}
            {selectedMethod === 'WEBSOCKET' ? (
              <div className="mt-3 space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    WebSocket Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="ws://192.168.4.1:81"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConnectWebSocket}
                  disabled={isSubmitting || hardwareStatus === 'CONNECTING'}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting || hardwareStatus === 'CONNECTING' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : hardwareStatus === 'CONNECTED' && hardwareConnectionType === 'WEBSOCKET' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Connected ({hardwareEndpoint})</span>
                    </>
                  ) : (
                    <span>Connect via WebSocket</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                <p className="text-xs text-slate-400">
                  Connect your ESP32 board via USB and select the COM port in the browser prompt (115200 baud). Web Serial continuously buffers incoming lines: <code className="text-cyan-300 font-mono text-[11px]">Recorded reading N | Distance D cm | Vibration V g | Status: ...</code>
                </p>

                {!isSerialSupported && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                    Web Serial is not supported in this browser. Please use Chrome, Edge, Brave, or Opera.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConnectSerial}
                  disabled={isSubmitting || !isSerialSupported || hardwareStatus === 'CONNECTING'}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting || hardwareStatus === 'CONNECTING' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Selecting Port...</span>
                    </>
                  ) : hardwareStatus === 'CONNECTED' && hardwareConnectionType === 'SERIAL' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Connected (Receiving Telemetry)</span>
                    </>
                  ) : hardwareStatus === 'AWAITING_TELEMETRY' && hardwareConnectionType === 'SERIAL' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      <span>Port Open — Awaiting Telemetry...</span>
                    </>
                  ) : (
                    <span>Select Serial Port (115200 Baud)</span>
                  )}
                </button>
              </div>
            )}

            {/* Expandable Advanced Settings */}
            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <span>Advanced Settings</span>
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showAdvanced && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Default AP Gateway: <code className="text-cyan-400 font-mono">192.168.4.1</code></div>
                  <div>Default Port: <code className="text-cyan-400 font-mono">81</code> (WebSocket)</div>
                  <div>Serial Baud Rate: <code className="text-cyan-400 font-mono">115200 8-N-1</code></div>
                  <div>Connection Timeout: <code className="text-cyan-400 font-mono">4000 ms</code></div>
                </div>
              )}
            </div>
          </div>

          {/* Choice 2: Run Demo Without Hardware */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Run Demo Without Hardware</h3>
                  <p className="text-xs text-slate-400">
                    Explore the dashboard using generated demonstration sensor readings. Demo results are not real-world measurements.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {operatingMode === 'SIMULATION' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Demo Mode Active — Return to Dashboard</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Demo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Demo detections are kept separate from real hardware records.</span>
          <button
            onClick={handleClose}
            className="text-slate-300 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
