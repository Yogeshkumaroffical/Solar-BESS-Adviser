"""
POST /analyze – runs the full financial analysis and returns AnalysisResult.
"""

from fastapi import APIRouter, HTTPException
from models.inputs import ProjectInputs
from models.outputs import AnalysisResult
from services.financial_engine import run_analysis

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(inputs: ProjectInputs) -> AnalysisResult:
    """
    Run a full Solar + BESS profitability analysis.

    Accepts project inputs (solar, BESS, revenue assumptions) and returns
    year-by-year cash flows, NPV/IRR/payback for both solar-only and hybrid
    scenarios, sensitivity analysis, and a recommendation.
    """
    try:
        result_dict = run_analysis(inputs)
        return AnalysisResult(**result_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
