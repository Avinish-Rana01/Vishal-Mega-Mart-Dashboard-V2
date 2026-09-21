import React from 'react';
import { Calendar, MapPin, Tag } from 'lucide-react';
import './ReportStatsHeader.css';

export default function ReportStatsHeader({ storeName, leftLabel, leftValue, date, fromDate, toDate }) {
  // Determine date display string
  let dateDisplay = null;
  
  if (fromDate && toDate) {
    dateDisplay = (
      <div className="report-header-date">
        <Calendar size={16} />
        <span>FROM DATE : <strong>{fromDate}</strong></span>
        <span className="divider">|</span>
        <span>TO DATE : <strong>{toDate}</strong></span>
      </div>
    );
  } else if (date) {
    dateDisplay = (
      <div className="report-header-date">
        <Calendar size={16} />
        <span>STOCK DATE : <strong>{date}</strong></span>
      </div>
    );
  }

  // Determine left display
  let leftDisplay = null;
  if (leftLabel && leftValue) {
    leftDisplay = (
      <div className="report-header-left">
        <Tag size={16} />
        <span>{leftLabel} : <strong>{leftValue}</strong></span>
      </div>
    );
  } else if (storeName) {
    leftDisplay = (
      <div className="report-header-left">
        <MapPin size={16} />
        <span>SELECTED STORE : <strong>{storeName}</strong></span>
      </div>
    );
  }

  return (
    <div className="report-stats-header-container premium-header">
      <div className="premium-left">
        {leftDisplay}
      </div>
      <div className="premium-right">
        {dateDisplay}
      </div>
    </div>
  );
}
