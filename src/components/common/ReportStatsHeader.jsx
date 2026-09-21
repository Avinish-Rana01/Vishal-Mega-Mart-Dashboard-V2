import React from 'react';
import './ReportStatsHeader.css';

export default function ReportStatsHeader({ storeName, leftLabel, leftValue, date, fromDate, toDate }) {
  // Determine date display string
  let dateDisplay = null;
  
  if (fromDate && toDate) {
    dateDisplay = `FROM DATE : ${fromDate} | TO DATE : ${toDate}`;
  } else if (date) {
    dateDisplay = `STOCK DATE : ${date}`;
  }

  // Determine left display
  let leftDisplay = null;
  if (leftLabel && leftValue) {
    leftDisplay = `${leftLabel} : ${leftValue}`;
  } else if (storeName) {
    leftDisplay = `SELECTED STORE : ${storeName}`;
  }

  return (
    <div className="report-stats-header-container">
      <div>
        {leftDisplay}
      </div>
      {dateDisplay && <div className="date-info">{dateDisplay}</div>}
    </div>
  );
}
