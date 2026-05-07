// RealizationUploadApprovalForm.tsx — Upload Approval Form for Realization module
// Requirements: 17.1-17.7
// Task 18.1: Create Upload Approval Form components

import React from 'react';
import { BaseUploadApprovalForm } from './BaseUploadApprovalForm';
import type { ApprovalFormProps } from '../formRegistry';

export const RealizationUploadApprovalForm: React.FC<ApprovalFormProps> = (props) => {
  return <BaseUploadApprovalForm {...props} />;
};

export default RealizationUploadApprovalForm;
