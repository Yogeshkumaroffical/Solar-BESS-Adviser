import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';

export default function RecommendationBanner() {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const rec = result.recommendation;
  const reason = result.recommendation_reason;

  let bannerClass = 'rec-banner ';
  let icon = '💡';
  if (rec === 'Attractive') {
    bannerClass += 'attractive';
    icon = '🟢';
  } else if (rec === 'Marginal') {
    bannerClass += 'marginal';
    icon = '🟡';
  } else {
    bannerClass += 'not-attractive';
    icon = '🔴';
  }

  return (
    <div className={bannerClass}>
      <span className="rec-icon">{icon}</span>
      <div>
        <div className="rec-label">{rec} BESS Option</div>
        <p className="rec-reason">{reason}</p>
      </div>
    </div>
  );
}
