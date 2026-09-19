import React from 'react';
import ReconciliationDetailsModal from './ReconciliationDetailsModal';

export default function VoidReconciliationModal(props) {
  return <ReconciliationDetailsModal {...props} type="void" />;
}
