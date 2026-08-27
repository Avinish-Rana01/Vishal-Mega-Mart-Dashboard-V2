import React from 'react';
import { AlertTriangle, Check, ArrowRight } from 'lucide-react';

export default function ActionAlertBar({ 
  below80Count = 5, 
  highVarianceCount = 3, 
  pendingCount = 2, 
  above95Count = 7,
  onViewAll 
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#fffbfc', 
      border: '1px solid #ffe4e6', 
      borderRadius: '12px',
      padding: '12px 24px',
      // margin: '6px 0 20px 0',
      width: '100%',
      boxShadow: '0 2px 8px -2px rgba(225, 29, 72, 0.05)',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      
      {/* Action Required Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e11d48' }}>
        <AlertTriangle size={22} strokeWidth={2.5} />
        <span style={{ fontSize: '14.5px', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase' }}>ACTION REQUIRED</span>
      </div>

      <div style={{ width: '1px', height: '36px', background: '#ffe4e6' }} />

      {/* Metric 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <span style={{ fontWeight: '800', fontSize: '18px', marginTop: '-2px' }}>!</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#450a0a', lineHeight: 1 }}>{below80Count}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', lineHeight: 1.3, maxWidth: '90px' }}>
            Stores below 80% accuracy
          </span>
        </div>
      </div>

      <div style={{ width: '1px', height: '36px', background: '#ffe4e6' }} />

      {/* Metric 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <span style={{ fontWeight: '800', fontSize: '18px', marginTop: '-2px' }}>!</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#450a0a', lineHeight: 1 }}>{highVarianceCount}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', lineHeight: 1.3, maxWidth: '100px' }}>
            Stores with variance {'>'} 10%
          </span>
        </div>
      </div>

      {/* <div style={{ width: '1px', height: '36px', background: '#ffe4e6' }} /> */}

      {/* Metric 3 */}
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <span style={{ fontWeight: '800', fontSize: '18px', marginTop: '-2px' }}>!</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#450a0a', lineHeight: 1 }}>{pendingCount}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', lineHeight: 1.3, maxWidth: '100px' }}>
            Stores pending stock validation
          </span>
        </div>
      </div> */}

      <div style={{ width: '1px', height: '36px', background: '#ffe4e6' }} />

      {/* Metric 4 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Check size={20} strokeWidth={3} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#450a0a', lineHeight: 1 }}>{above95Count}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', lineHeight: 1.3, maxWidth: '90px' }}>
            Stores ≥ 95% accuracy
          </span>
        </div>
      </div>

      {/* Right Link */}
      <div 
        onClick={onViewAll}
        style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          color: '#2563eb', 
          fontWeight: '700', 
          fontSize: '13.5px',
          cursor: 'pointer'
        }}
      >
        View All Alerts <ArrowRight size={18} strokeWidth={2.5} />
      </div>

    </div>
  );
}
