import React from 'react';
import TickerNumber from './TickerNumber';


const DefaultCardIcon = ({ className = 'w-10 h-10', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M4 9C4 6.23858 6.23858 4 9 4V9H4Z" />
    <path d="M13 9C13 6.23858 15.2386 4 18 4V9H13Z" />
    <path d="M4 18C4 15.2386 6.23858 13 9 13V18H4Z" />
    <path d="M13 18C13 15.2386 15.2386 13 18 13V18H13Z" />
  </svg>
);


export default function StatCard({
  title,
  text,
  count,
  value,
  icon,
  iconSize,
  variant = 'green',
  className = '',
  loading = false,
  isLoading = false,
  shimmer = false,
  compact = false,
}) {
  const cardTitle = title || text || 'NA';
  const cardCount = value !== undefined && value !== null ? value : (count !== undefined && count !== null ? count : '0');
  const isCardLoading = loading || isLoading;

  const variantStyles = {
    green: {
      cardBg: 'bg-gradient-to-br from-[#dff2e1] via-[#cdebd1] to-[#bfe4c4]',
      shadow: 'shadow-xs shadow-emerald-900/5',
      iconColor: 'text-[#166534]',
      titleColor: 'text-[#1e543b]',
      countColor: 'text-[#14532d]',
      skeletonTitle: 'bg-[#166534]/15',
      skeletonCount: 'bg-[#14532d]/20',
    },
    blue: {
      cardBg: 'bg-gradient-to-br from-[#e0f2f7] via-[#cfe8f1] to-[#bde0eb]',
      shadow: 'shadow-xs shadow-sky-900/5',
      iconColor: 'text-[#0e7490]',
      titleColor: 'text-[#155468]',
      countColor: 'text-[#083344]',
      skeletonTitle: 'bg-[#0e7490]/15',
      skeletonCount: 'bg-[#083344]/20',
    },
    gray: {
      cardBg: 'bg-gradient-to-br from-[#f5f5f5] via-[#ececec] to-[#dfdfdf]',
      shadow: 'shadow-xs shadow-slate-900/5',
      iconColor: 'text-[#475569]',
      titleColor: 'text-[#475569]',
      countColor: 'text-[#0f172a]',
      skeletonTitle: 'bg-[#475569]/15',
      skeletonCount: 'bg-[#0f172a]/20',
    },
    rose: {
      cardBg: 'bg-gradient-to-br from-[#ffe4e6] via-[#fecdd3] to-[#fbcfe8]',
      shadow: 'shadow-xs shadow-rose-900/5',
      iconColor: 'text-[#e11d48]',
      titleColor: 'text-[#9f1239]',
      countColor: 'text-[#881337]',
      skeletonTitle: 'bg-[#e11d48]/15',
      skeletonCount: 'bg-[#881337]/20',
    },
    amber: {
      cardBg: 'bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fed7aa]',
      shadow: 'shadow-xs shadow-amber-900/5',
      iconColor: 'text-[#d97706]',
      titleColor: 'text-[#92400e]',
      countColor: 'text-[#78350f]',
      skeletonTitle: 'bg-[#d97706]/15',
      skeletonCount: 'bg-[#78350f]/20',
    },
    purple: {
      cardBg: 'bg-gradient-to-br from-[#ede9fe] via-[#e0e7ff] to-[#c7d2fe]',
      shadow: 'shadow-xs shadow-indigo-900/5',
      iconColor: 'text-[#4338ca]',
      titleColor: 'text-[#3730a3]',
      countColor: 'text-[#1e1b4b]',
      skeletonTitle: 'bg-[#4338ca]/15',
      skeletonCount: 'bg-[#1e1b4b]/20',
    },
  };

  const currentTheme = variantStyles[variant] || variantStyles.green;
  const isExplicitCssSize =
    typeof iconSize === 'number' ||
    (typeof iconSize === 'string' && /^\d+(\.\d+)?(px|rem|em|%)$/.test(iconSize.trim()));

  const iconSizeStyle = isExplicitCssSize
    ? {
        width: typeof iconSize === 'number' ? `${iconSize}px` : iconSize.trim(),
        height: typeof iconSize === 'number' ? `${iconSize}px` : iconSize.trim(),
      }
    : undefined;

  const iconSizeClasses = isExplicitCssSize
    ? ''
    : typeof iconSize === 'string' && iconSize.trim()
      ? iconSize.trim()
      : compact
        ? 'w-11 h-11 sm:w-12 sm:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16'
        : 'w-13 h-13 sm:w-16 sm:h-16 xl:w-18 xl:h-18 2xl:w-20 2xl:h-20';

  const renderBigIcon = () => {
    if (!icon) {
      return <DefaultCardIcon className={iconSizeClasses} style={iconSizeStyle} />;
    }
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: `${icon.props.className || ''} ${iconSizeClasses}`.trim() || undefined,
        style: iconSizeStyle ? { ...icon.props.style, ...iconSizeStyle } : icon.props.style,
        strokeWidth: icon.props.strokeWidth || 1.6,
      });
    }
    const IconComponent = icon;
    return (
      <IconComponent
        className={iconSizeClasses || undefined}
        style={iconSizeStyle}
        strokeWidth={1.6}
      />
    );
  };

  // 1. Shimmer Skeleton Loading State
  if (isCardLoading) {
    return (
      <div
        className={`relative w-full rounded-2xl p-3.5 sm:p-4 xl:p-4.5 2xl:p-5 overflow-hidden flex flex-col justify-center min-h-[82px] sm:min-h-[88px] xl:min-h-[96px] 2xl:min-h-[106px] ${currentTheme.cardBg} ${currentTheme.shadow} ${className}`}
        role="status"
        aria-label="Loading metric"
      >
        {/* Continuous Shimmer Light Sweep */}
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none z-20"
          aria-hidden="true"
        />

        {/* Skeleton Placeholders */}
        <div className="relative z-10 pr-12 sm:pr-14 xl:pr-16">
          <div className={`h-3 w-28 rounded-md mb-2.5 ${currentTheme.skeletonTitle}`} />
          <div className={`h-6 w-20 rounded-md ${currentTheme.skeletonCount}`} />
        </div>

        {/* Faint Background Icon */}
        <div
          className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-10 ${currentTheme.iconColor}`}
          aria-hidden="true"
        >
          {renderBigIcon()}
        </div>
      </div>
    );
  }

  // 2. Active Card State with Ambient Shimmer / Hover Sheen
  return (
    <div
      className={`group relative w-full rounded-2xl ${
        compact ? 'p-3 sm:p-3.5 xl:p-4 min-h-[78px] sm:min-h-[84px] xl:min-h-[90px]' : 'p-3.5 sm:p-4 xl:p-4.5 2xl:p-5 min-h-[82px] sm:min-h-[88px] xl:min-h-[96px] 2xl:min-h-[106px]'
      } overflow-hidden flex flex-col justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${currentTheme.cardBg} ${currentTheme.shadow} ${className}`}
    >
      {/* Continuous Ambient Shimmer or Hover Sheen Sweep */}
      {shimmer ? (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20"
          aria-hidden="true"
        />
      )}

      {/* Foreground Content: Title & Count on Left */}
      <div className={`relative z-10 ${compact ? 'w-full' : 'pr-12 sm:pr-14 xl:pr-16'}`}>
        <h4
          className={`mb-1.5 sm:mb-2 ${
            compact
              ? 'text-[11.5px] sm:text-xs xl:text-[12.5px] 2xl:text-[13.5px] leading-tight whitespace-nowrap'
              : 'text-xs sm:text-[13px] xl:text-[13.5px] 2xl:text-sm truncate'
          } font-semibold tracking-tight ${currentTheme.titleColor}`}
        >
          {cardTitle}
        </h4>
        <div className={`${compact ? 'text-base sm:text-lg xl:text-xl 2xl:text-2xl' : 'text-lg sm:text-xl xl:text-2xl 2xl:text-[26px]'} font-bold tracking-tight mt-0.5 ${currentTheme.countColor}`}>
          {React.isValidElement(cardCount) ? cardCount : <TickerNumber value={cardCount} />}
        </div>
      </div>

      {/* Background: Big Icon on Right with Opacity */}
      <div
        className={`absolute ${compact ? 'right-1.5 sm:right-2.5 bottom-1.5 sm:bottom-2' : 'right-2 sm:right-3 top-1/2 -translate-y-1/2'} pointer-events-none opacity-20 transition-transform group-hover:scale-105 ${currentTheme.iconColor}`}
        aria-hidden="true"
      >
        {renderBigIcon()}
      </div>
    </div>
  );
}

/**
 * Dedicated StatCardSkeleton component
 */
export function StatCardSkeleton(props) {
  return <StatCard {...props} loading={true} />;
}
