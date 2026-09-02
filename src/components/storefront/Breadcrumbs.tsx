import React from 'react';
import { Link, useNavigate } from 'react-router';

export interface BreadcrumbSegment {
  label: string;
  path?: string;
  state?: any;
  icon?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  idPrefix?: string;
}

export function Breadcrumbs({ segments, idPrefix = 'breadcrumb' }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="w-full py-3 px-1 mb-6 border-b border-neutral-100 dark:border-neutral-800"
      id={`${idPrefix}-nav`}
    >
      <div 
        className="flex items-center gap-1.5 text-xs font-space font-medium text-on-surface-variant overflow-x-auto whitespace-nowrap scrollbar-none py-1"
        id={`${idPrefix}-list`}
      >
        {/* Home icon link as starting segment always, if not already specified */}
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span 
                  className="text-neutral-300 dark:text-neutral-700 select-none px-0.5 flex items-center justify-center"
                  aria-hidden="true"
                  id={`${idPrefix}-separator-${idx}`}
                >
                  <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </span>
              )}
              
              <div 
                className="flex items-center"
                id={`${idPrefix}-item-${idx}`}
              >
                {isLast ? (
                  <span 
                    className="text-on-surface dark:text-white font-semibold truncate max-w-[150px] sm:max-w-[250px]"
                    aria-current="page"
                    id={`${idPrefix}-label-active-${idx}`}
                  >
                    {seg.label}
                  </span>
                ) : seg.path ? (
                  <Link
                    to={seg.path}
                    state={seg.state}
                    className="hover:text-primary dark:hover:text-primary transition-all duration-200 flex items-center gap-1 text-on-surface-variant dark:text-neutral-400 hover:underline underline-offset-4 decoration-primary/40"
                    id={`${idPrefix}-link-${idx}`}
                  >
                    {seg.icon && (
                      <span className="material-symbols-outlined text-[14px] flex items-center justify-center">
                        {seg.icon}
                      </span>
                    )}
                    <span>{seg.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (seg.onClick) {
                        seg.onClick();
                      } else if (seg.state) {
                        navigate(seg.path || '/', { state: seg.state });
                      }
                    }}
                    className="hover:text-primary dark:hover:text-primary transition-all duration-200 flex items-center gap-1 text-on-surface-variant dark:text-neutral-400 font-medium hover:underline underline-offset-4 decoration-primary/40 cursor-pointer"
                    id={`${idPrefix}-btn-${idx}`}
                  >
                    {seg.icon && (
                      <span className="material-symbols-outlined text-[14px] flex items-center justify-center">
                        {seg.icon}
                      </span>
                    )}
                    <span>{seg.label}</span>
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
