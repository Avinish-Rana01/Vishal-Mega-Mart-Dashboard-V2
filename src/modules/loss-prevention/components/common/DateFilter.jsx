import React, { useState, useEffect, useRef, useId } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, ChevronDown, Check, RotateCcw, X } from 'lucide-react';
import { DATE_PRESETS, formatDate } from '../../utils/filterConstants';
import { LP_EVENTS, notifyPopoverOpened } from '../../../../services/lossPreventionService';

export default function DateFilter({
    selectedDate: controlledDate,
    defaultDate = 'Today',
    onDateChange,
    className = '',
}) {
    const [internalDate, setInternalDate] = useState(defaultDate);
    const [isOpen, setIsOpen] = useState(false);
    const [dateRange, setDateRange] = useState([new Date(), new Date()]);
    const [startDate, endDate] = dateRange;
    const containerRef = useRef(null);
    const popoverId = useId();

    // Close popover on outside click, Escape key, or when another LP dropdown opens
    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        const handleOtherPopover = (e) => {
            if (e.detail?.source !== popoverId) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
        };
    }, [isOpen, popoverId]);

    const handleToggle = () => {
        const nextOpen = !isOpen;
        if (nextOpen) {
            notifyPopoverOpened(popoverId);
        }
        setIsOpen(nextOpen);
    };

    const currentDateLabel = controlledDate !== undefined ? controlledDate : internalDate;

    // Preset Selection Handler (applies selection and closes)
    const handleSelectPreset = (preset) => {
        const today = new Date();
        let start = today;
        let end = today;

        if (preset === 'Today') {
            start = today;
            end = today;
        } else if (preset === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            start = yesterday;
            end = yesterday;
        } else if (preset === 'Last 7 Days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 6);
            start = sevenDaysAgo;
            end = today;
        } else if (preset === 'This Month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = today;
        } else if (preset === 'Last 30 Days') {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 29);
            start = thirtyDaysAgo;
            end = today;
        }

        setDateRange([start, end]);
        if (controlledDate === undefined) {
            setInternalDate(preset);
        }
        setIsOpen(false);

        if (onDateChange) {
            onDateChange(preset, { startDate: start, endDate: end, preset });
        }
    };

    // React DatePicker Range Change Handler
    const handleDatePickerChange = (update) => {
        const [start, end] = update;
        setDateRange([start, end]);
    };

    // Manual Apply for custom selection
    const handleApplyRange = () => {
        if (!startDate) return;
        const isSingleDay = !endDate || formatDate(startDate) === formatDate(endDate);
        const formatted = isSingleDay
            ? formatDate(startDate)
            : `${formatDate(startDate)} - ${formatDate(endDate)}`;

        if (controlledDate === undefined) {
            setInternalDate(formatted);
        }
        setIsOpen(false);

        if (onDateChange) {
            onDateChange(formatted, { startDate, endDate: endDate || startDate });
        }
    };

    const isFiltered = currentDateLabel && currentDateLabel !== 'Today';

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            {/* Date Range Trigger Button - Professional styling matching store filter */}
            <button
                type="button"
                onClick={handleToggle}
                className={`h-8.5 px-3 bg-white rounded-lg flex items-center gap-2 text-xs font-medium shadow-2xs transition-all cursor-pointer select-none border ${
                    isFiltered
                        ? 'border-sky-300 bg-sky-50/20 text-slate-900 hover:border-sky-400'
                        : 'border-slate-200/90 hover:border-slate-300 text-slate-700'
                }`}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={`Date Filter: ${currentDateLabel}`}
            >
                <Calendar className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />

                {isFiltered ? (
                    <span className="inline-flex items-center text-[10.5px] font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded tracking-wide whitespace-nowrap">
                        {currentDateLabel}
                    </span>
                ) : (
                    <span className="font-semibold text-slate-800 tracking-tight whitespace-nowrap">
                        {currentDateLabel}
                    </span>
                )}

                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* React DatePicker Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[1200] animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden flex flex-col sm:flex-row min-w-[320px] sm:min-w-[420px]">
                    {/* Presets Sidebar */}
                    <div className="w-full sm:w-36 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/70 p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible shrink-0">
                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 hidden sm:block">
                            Presets
                        </p>
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={`text-left px-2.5 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center justify-between ${currentDateLabel === preset
                                        ? 'bg-[#00a8e7] text-white font-semibold shadow-xs'
                                        : 'text-slate-700 hover:bg-slate-200/70'
                                    }`}
                            >
                                <span>{preset}</span>
                                {currentDateLabel === preset && (
                                    <Check className="w-3 h-3 text-white shrink-0 hidden sm:block" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* React DatePicker Inline Calendar */}
                    <div className="p-3 flex flex-col flex-1 min-w-[270px]">
                        <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-100 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800 text-[11.5px]">Select Custom Range</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelectPreset('Today')}
                                    className="text-[#00a8e7] hover:underline flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-md transition-colors cursor-pointer border border-slate-200/80"
                                    title="Close Datepicker"
                                    aria-label="Close Datepicker"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="w-full flex justify-center py-1">
                            <DatePicker
                                selectsRange
                                startDate={startDate}
                                endDate={endDate}
                                onChange={handleDatePickerChange}
                                inline
                                maxDate={new Date()}
                            />
                        </div>

                        {/* Footer with Highlighted Date Range in DD-MM-YYYY, Gray Close Button, and Apply Button */}
                        <div className="w-full pt-2.5 border-t border-slate-100 mt-1.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 truncate min-w-0 font-medium">
                                {startDate ? (
                                    <>
                                        <span className="font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md text-[11.5px] shadow-2xs">
                                            {formatDate(startDate)}
                                        </span>
                                        {endDate && formatDate(startDate) !== formatDate(endDate) && (
                                            <>
                                                <span className="text-slate-400 font-semibold">→</span>
                                                <span className="font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md text-[11.5px] shadow-2xs">
                                                    {formatDate(endDate)}
                                                </span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[11.5px] text-slate-400 font-normal">Select date range</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-300/80 shadow-2xs"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyRange}
                                    disabled={!startDate}
                                    className="px-4 py-1.5 bg-[#00a8e7] hover:bg-[#0092c8] active:bg-[#007ba8] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
