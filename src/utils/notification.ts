import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { Locale } from '../i18n/commons';
import { thresholdI18n } from '../i18n/thresholds';
import { ratiosI18n } from '../i18n/ratios';
import { bankLoanI18n } from '../i18n/bank-loan';

export const renderNotificationMessage = (notification: any, language: Locale) => {
  const { templateKey, templateVars, category, payload } = notification;
  const msgVars = templateVars || payload || {};

  // 1. Handle Loan Installments
  if (category === 'loan-installment-due' || notification.sourceEntityType === 'bank_loan_installment') {
    const amount = Number(msgVars.amount || 0).toLocaleString(language === 'id' ? 'id-ID' : 'en-US');
    const dateLocale = language === 'id' ? id : enUS;
    const dueDate = msgVars.dueDate ? format(new Date(msgVars.dueDate), 'dd MMM yyyy', { locale: dateLocale }) : '';
    
    return bankLoanI18n[language].notifications.installmentDue
      .replace('{amount}', amount)
      .replace('{dueDate}', dueDate);
  }

  // 2. Handle Threshold Alerts
  // Sometimes templateKey is missing but we have it in payload.message
  let effectiveTemplateKey = templateKey || (String(payload?.message || '').startsWith('cfd.threshold.') ? payload.message : null);
  
  // If no prefix, check if it's a known threshold message key
  if (!effectiveTemplateKey && payload?.messageKey) {
    effectiveTemplateKey = `cfd.threshold.${payload.messageKey}`;
  }
  if (!effectiveTemplateKey && (templateKey === 'belowHealthy' || templateKey === 'criticallyBelow' || templateKey === 'aboveHealthy' || templateKey === 'criticallyAbove')) {
    effectiveTemplateKey = `cfd.threshold.${templateKey}`;
  }
  if (!effectiveTemplateKey && (payload?.message === 'belowHealthy' || payload?.message === 'criticallyBelow' || payload?.message === 'aboveHealthy' || payload?.message === 'criticallyAbove')) {
    effectiveTemplateKey = `cfd.threshold.${payload.message}`;
  }

  // HEALER: Detect legacy English strings and map to template keys
  if (!effectiveTemplateKey && typeof payload?.message === 'string') {
    const msg = payload.message;
    if (msg.includes('is below moderate threshold')) effectiveTemplateKey = 'cfd.threshold.criticallyBelow';
    else if (msg.includes('is below healthy threshold')) effectiveTemplateKey = 'cfd.threshold.belowHealthy';
    else if (msg.includes('is above moderate threshold')) effectiveTemplateKey = 'cfd.threshold.criticallyAbove';
    else if (msg.includes('is above healthy threshold')) effectiveTemplateKey = 'cfd.threshold.aboveHealthy';
    else if (msg.includes('Operating Cash Flow is negative')) effectiveTemplateKey = 'cfd.threshold.negativeOcf';
    else if (msg.includes('declining trend')) effectiveTemplateKey = 'cfd.threshold.decliningTrend';
  }

  if (effectiveTemplateKey?.startsWith('cfd.threshold.')) {
    const subKey = effectiveTemplateKey.replace('cfd.threshold.', '');
    const thresholdCopy = thresholdI18n[language];
    const translation = thresholdCopy.messages[subKey as keyof typeof thresholdCopy['messages']];
    
    if (translation) {
      let result = translation;

      // Variable extraction priorities
      let ratioKey = msgVars.ratio || msgVars.ratioName || payload?.ratioName || category;
      
      // Heuristic: If ratioKey is generic 'alert' or 'cfd', try to find it in the message
      if ((ratioKey === 'alert' || ratioKey === 'cfd') && typeof payload?.message === 'string') {
        const words = payload.message.split(' ');
        const firstWord = words[0]?.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (firstWord && ratiosI18n[language][firstWord as keyof typeof ratiosI18n['id']]) {
          ratioKey = firstWord;
        }
      }

      const ratioLabel = ratiosI18n[language][ratioKey as keyof typeof ratiosI18n['id']]?.label || ratioKey;
      
      const variables: Record<string, any> = {
        ...msgVars,
        ratio: ratioLabel,
        // Format numbers if they look like numbers
        value: typeof msgVars.value !== 'undefined' ? Number(msgVars.value).toFixed(2) : (typeof msgVars.currentValue !== 'undefined' ? Number(msgVars.currentValue).toFixed(2) : ''),
        threshold: typeof msgVars.threshold !== 'undefined' ? Number(msgVars.threshold).toFixed(2) : (typeof msgVars.thresholdValue !== 'undefined' ? Number(msgVars.thresholdValue).toFixed(2) : ''),
      };

      // If we healed from a legacy string, try to extract values from the string if missing in vars
      if (typeof payload?.message === 'string' && (!variables.value || !variables.threshold)) {
        const numMatches = payload.message.match(/[\d.]+/g);
        if (numMatches && numMatches.length >= 2) {
          if (!variables.value) variables.value = numMatches[0];
          if (!variables.threshold) variables.threshold = numMatches[1];
        }
      }

      Object.entries(variables).forEach(([key, val]) => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      });
      return result;
    }
  }

  // 3. Fallback to message or templateKey
  return String(payload?.message || payload?.messageKey || templateKey || 'Notification');
};
