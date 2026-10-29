import React from 'react';
import { ProjectStatus, ScopeStatus, ClientHealth, TaskPriority, TaskStatus } from '../../types';

interface StatusBadgeProps {
  status:
    | ProjectStatus
    | ScopeStatus
    | ClientHealth
    | TaskPriority
    | TaskStatus
    | 'Pending Approval'
    | 'Approved'
    | 'Rejected'
    | 'Optimal'
    | 'At Capacity'
    | 'Overloaded'
    | 'On Schedule'
    | 'Delivered'
    | 'Critical Risk'
    | 'High'
    | 'Medium'
    | 'Pending'
    | 'Due Soon'
    | 'Overdue'
    | 'Fulfilled'
    | 'Active Blocker'
    | 'Resolved'
    | 'Ready for Delivery'
    | 'Pending Gates'
    | 'Blocked by QA';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let style = 'bg-[#F2EFE9] text-[#55524B] border-[#E2DDD3]';

  switch (status) {
    // Healthy / Success / Done / Optimal / Delivered / Completed / Fulfilled
    case 'On Track':
    case 'Healthy':
    case 'Done':
    case 'Completed':
    case 'Fulfilled':
    case 'Approved':
    case 'Optimal':
    case 'On Schedule':
    case 'Delivered':
    case 'Resolved':
    case 'Ready for Delivery':
      style = 'bg-[#EBF5EE] text-[#1E5631] border-[#CCE8D4]';
      break;

    // Warning / Attention / At Risk / Revision / Due Soon
    case 'At Risk':
    case 'Needs Attention':
    case 'Revision Pending':
    case 'At Capacity':
    case 'Pending Approval':
    case 'Pending':
    case 'Due Soon':
    case 'Pending Gates':
    case 'In Review':
    case 'Review':
    case 'High':
    case 'Medium':
      style = 'bg-[#FEF7EC] text-[#975A16] border-[#FCE2BE]';
      break;

    // Danger / Blocked / Overdue / Critical
    case 'Blocked':
    case 'Overloaded':
    case 'Overdue':
    case 'Critical Risk':
    case 'Active Blocker':
    case 'Blocked by QA':
    case 'Scope Creep Alert':
    case 'Urgent':
    case 'Rejected':
      style = 'bg-[#FDF2F2] text-[#9B1C1C] border-[#F8CACA]';
      break;

    // Neutral / In Progress / Info
    case 'In Progress':
    case 'Todo':
    case 'To Do':
    case 'Locked':
    case 'Low':
    default:
      style = 'bg-[#F4F1EA] text-[#4F4C45] border-[#E5E0D7]';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style} whitespace-nowrap`}
    >
      {status}
    </span>
  );
};
