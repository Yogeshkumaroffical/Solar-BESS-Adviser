"""
Export endpoints:
  POST /api/export/excel  → returns .xlsx binary
  POST /api/export/pdf    → returns .pdf binary
  POST /api/advisory      → returns AI-generated advisory note
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.outputs import AnalysisResult, AdvisoryNoteRequest, AdvisoryNoteResponse
from services.export_service import generate_excel, generate_pdf
from services.advisory import generate_advisory_note

router = APIRouter(prefix="/api", tags=["export"])


@router.post("/export/excel")
async def export_excel(result: AnalysisResult, project_name: str = "Solar BESS Project") -> Response:
    """Download a styled Excel workbook with all analysis results."""
    try:
        xlsx_bytes = generate_excel(result, project_name)
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{project_name.replace(" ", "_")}_analysis.xlsx"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {str(e)}")


@router.post("/export/pdf")
async def export_pdf(result: AnalysisResult, project_name: str = "Solar BESS Project") -> Response:
    """Download a PDF profitability report."""
    try:
        pdf_bytes = generate_pdf(result, project_name)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{project_name.replace(" ", "_")}_report.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/advisory", response_model=AdvisoryNoteResponse)
async def advisory_note(request: AdvisoryNoteRequest) -> AdvisoryNoteResponse:
    """Generate an AI-powered advisory narrative using Google Gemini."""
    return await generate_advisory_note(
        result=request.result,
        project_name=request.project_name,
        consultant_name=request.consultant_name,
    )
