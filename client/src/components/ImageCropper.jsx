import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { Dialog } from '@headlessui/react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const ImageCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            setIsProcessing(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
            onCropComplete(croppedBlob);
        } catch (e) {
            // Processing error managed by component state logic
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white pt-6 pb-8 px-6 sm:px-8 text-left align-middle shadow-2xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title as="h3" className="text-xl font-black text-slate-900 leading-6 tracking-tight">
                            Adjust Profile Picture
                        </Dialog.Title>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors rounded-full p-2 hover:bg-slate-100">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="relative w-full h-64 sm:h-72 bg-slate-100 rounded-3xl overflow-hidden mb-6 shadow-inner ring-1 ring-slate-200">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="mb-6 px-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Zoom</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#155DFC] text-white font-black rounded-2xl shadow-xl hover:bg-[#124ECC] hover:shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? <FaSpinner className="animate-spin text-xl" /> : 'Confirm'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default ImageCropperModal;
